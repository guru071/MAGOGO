import math
import json
import random
from typing import List, Dict, Any, Optional
from collections import defaultdict, Counter

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..utils.text import tokenize, text_similarity
from ..utils.scoring import sigmoid, min_max_normalize
from .features import FeatureExtractor


import numpy as np
from .embeddings import get_embedding

def get_prompt_embedding(prompt: Dict) -> np.ndarray:
    """Extract or generate embedding for a prompt."""
    # Check if we fetched it from DB as text string '[0.1, 0.2, ...]'
    emb_str = prompt.get('embedding_str')
    if emb_str and isinstance(emb_str, str) and emb_str.startswith('['):
        try:
            return np.array(json.loads(emb_str), dtype=float)
        except:
            pass
    
    # If no embedding in DB, fallback to generating it on the fly
    title = prompt.get('title', '')
    desc = prompt.get('description', '')
    tags_raw = prompt.get('tags', '[]')
    if isinstance(tags_raw, str):
        try:
            tags = json.loads(tags_raw)
            tags_text = ' '.join(tags) if isinstance(tags, list) else tags_raw
        except:
            tags_text = tags_raw
    else:
        tags_text = str(tags_raw)
        
    text = f"{title} {desc} {tags_text}"
    vec = get_embedding(text)
    return np.array(vec, dtype=float)

def compute_content_similarity(
    user_orders: Optional[List[Dict]],
    user_wishlist: Optional[List[Dict]],
    candidate_prompts: List[Dict],
) -> Dict[str, float]:
    """Compute dense vector cosine similarity between user profile and each candidate.
    User vector is the mean of all their interacted prompt vectors.
    """
    interacted_prompts = []
    if user_orders:
        for o in user_orders:
            if o.get('prompt'):
                interacted_prompts.append(o['prompt'])
    if user_wishlist:
        for w in user_wishlist:
            p = w.get('prompt', w) if isinstance(w, dict) else None
            if isinstance(p, dict):
                interacted_prompts.append(p)
                
    if not interacted_prompts:
        return {p.get('id', ''): 0.0 for p in candidate_prompts}

    # Compute User Vector (Mean of interacted prompt embeddings)
    user_vectors = [get_prompt_embedding(p) for p in interacted_prompts]
    user_vector = np.mean(user_vectors, axis=0)

    # Compute similarities for candidates
    result = {}
    for p in candidate_prompts:
        pid = p.get('id', '')
        cand_vec = get_prompt_embedding(p)
        
        # Cosine similarity: dot(A, B) / (norm(A) * norm(B))
        norm_u = np.linalg.norm(user_vector)
        norm_c = np.linalg.norm(cand_vec)
        if norm_u == 0 or norm_c == 0:
            sim = 0.0
        else:
            sim = np.dot(user_vector, cand_vec) / (norm_u * norm_c)
            
        result[pid] = max(0.0, min(1.0, float(sim)))

    return result


class RecommendationEngine:
    """Multi-strategy recommendation engine.
    Combines collaborative filtering, content-based, popularity, and exploration.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()

    def recommend_for_user(
        self,
        user: Optional[Dict],
        all_prompts: List[Dict],
        user_orders: Optional[List[Dict]] = None,
        user_wishlist: Optional[List[str]] = None,
        top_n: int = 20,
    ) -> List[Dict]:
        if not all_prompts:
            return []

        purchased_ids = set()
        if user_orders:
            purchased_ids = {o.get('promptId') for o in user_orders if o.get('promptId')}

        wishlist_ids = set(user_wishlist or [])

        candidates = [p for p in all_prompts if p.get('id') not in purchased_ids]

        if not candidates:
            candidates = all_prompts

        if not user:
            return self._trending_recommendations(candidates, top_n)

        user_categories = self._get_user_category_preference(user_orders, all_prompts)

        content_sims = compute_content_similarity(user_orders, user_wishlist, candidates)

        scored = []
        for prompt in candidates:
            scores = self._score_for_user(prompt, user, user_categories, purchased_ids, wishlist_ids, content_sims)
            combined = (
                0.25 * scores['category_match'] +
                0.15 * scores['wishlist_affinity'] +
                0.15 * scores['content_similarity'] +
                0.15 * scores['popularity'] +
                0.10 * scores['recency'] +
                0.10 * scores['seller_quality'] +
                0.10 * scores['price_affinity']
            )
            scored.append((combined, prompt, scores))

        scored.sort(key=lambda x: x[0], reverse=True)

        # Explore vs Exploit: inject some variety
        result = []
        top_picks = scored[:max(top_n, 5)]
        # Ensure some diversity in categories
        seen_categories = set()
        for score, prompt, breakdown in top_picks:
            cat = prompt.get('categoryId')
            if cat and cat in seen_categories:
                score *= 0.8
            seen_categories.add(cat)

        top_picks.sort(key=lambda x: x[0], reverse=True)

        for score, prompt, breakdown in top_picks[:top_n]:
            prompt['_rec_score'] = round(score, 4)
            prompt['_rec_breakdown'] = {k: round(v, 4) for k, v in breakdown.items()}
            result.append(prompt)

        return result

    def _score_for_user(
        self,
        prompt: Dict,
        user: Dict,
        user_categories: Dict[str, float],
        purchased_ids: set,
        wishlist_ids: set,
        content_sims: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        category_id = prompt.get('categoryId', '')
        seller_id = prompt.get('sellerId', '')

        # --- Category Match ---
        category_match = user_categories.get(category_id, 0.0)

        # --- Wishlist Affinity ---
        wishlist_affinity = 1.0 if prompt.get('id') in wishlist_ids else 0.0

        # --- Content Similarity (TF-IDF to user's interacted prompts) ---
        content_similarity = (content_sims or {}).get(prompt.get('id', ''), 0.0)

        # --- Popularity ---
        view_count = int(prompt.get('viewCount', 0))
        like_count = int(prompt.get('likeCount', 0))
        download_count = int(prompt.get('downloadCount', 0))
        rating = float(prompt.get('rating', 0))

        popularity = (
            0.25 * sigmoid(view_count / 200, 0.5) +
            0.25 * sigmoid(like_count / 100, 0.5) +
            0.25 * sigmoid(download_count / 100, 0.5) +
            0.25 * (rating / 5.0)
        )

        # --- Recency ---
        from ..utils.scoring import exponential_decay
        from ..utils.text import tokenize
        created_at = prompt.get('createdAt', '')
        age_hours = 8760
        if created_at:
            try:
                from datetime import datetime, timezone
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
            except:
                pass
        recency = exponential_decay(age_hours, half_life=336.0)

        # --- Seller Quality ---
        seller = prompt.get('seller', {}) or {}
        seller_quality = (
            0.4 * (1.0 if seller.get('isVerified') else 0.0) +
            0.3 * min(float(seller.get('totalEarnings', 0)) / 10000, 1.0) +
            0.3 * (1.0 if seller.get('isSeller') else 0.0)
        )

        # --- Price Affinity ---
        price = float(prompt.get('price', 0))
        is_free = prompt.get('isFree', False)
        price_affinity = 1.0 if is_free else sigmoid(1.0 - price / 100, 2.0)

        return {
            'category_match': category_match,
            'wishlist_affinity': wishlist_affinity,
            'content_similarity': content_similarity,
            'popularity': popularity,
            'recency': recency,
            'seller_quality': seller_quality,
            'price_affinity': price_affinity,
        }

    def _get_user_category_preference(
        self,
        orders: Optional[List[Dict]],
        all_prompts: List[Dict],
    ) -> Dict[str, float]:
        pref = defaultdict(float)
        if not orders:
            return dict(pref)

        prompt_map = {p.get('id'): p for p in all_prompts}
        for order in orders:
            prompt_id = order.get('promptId')
            prompt = prompt_map.get(prompt_id)
            if prompt:
                cat = prompt.get('categoryId')
                if cat:
                    pref[cat] += 1.0

        if pref:
            total = sum(pref.values())
            pref = {k: v / total for k, v in pref.items()}

        return dict(pref)

    def _trending_recommendations(self, prompts: List[Dict], top_n: int) -> List[Dict]:
        scored = []
        for p in prompts:
            view = int(p.get('viewCount', 0))
            like = int(p.get('likeCount', 0))
            dl = int(p.get('downloadCount', 0))
            rating = float(p.get('rating', 0))
            trend = (
                0.3 * sigmoid(view / 500, 0.3) +
                0.3 * sigmoid(like / 200, 0.3) +
                0.2 * sigmoid(dl / 200, 0.3) +
                0.2 * (rating / 5.0)
            )
            is_featured = p.get('isFeatured', False)
            if is_featured:
                trend *= 1.2
            scored.append((trend, p))

        scored.sort(key=lambda x: x[0], reverse=True)
        result = []
        for score, p in scored[:top_n]:
            p['_trend_score'] = round(score, 4)
            result.append(p)
        return result

    def similar_prompts(
        self,
        prompt: Dict,
        all_prompts: List[Dict],
        top_n: int = 6,
    ) -> List[Dict]:
        prompt_id = prompt.get('id', '')
        category_id = prompt.get('categoryId', '')
        
        source_vec = get_prompt_embedding(prompt)
        norm_s = np.linalg.norm(source_vec)

        scored = []
        for p in all_prompts:
            if p.get('id') == prompt_id:
                continue

            score = 0.0

            # Category match
            if p.get('categoryId') == category_id:
                score += 0.4

            # Vector similarity
            cand_vec = get_prompt_embedding(p)
            norm_c = np.linalg.norm(cand_vec)
            if norm_s > 0 and norm_c > 0:
                text_sim = np.dot(source_vec, cand_vec) / (norm_s * norm_c)
                score += 0.4 * text_sim

            # Same seller
            if p.get('sellerId') and p['sellerId'] == prompt.get('sellerId'):
                score += 0.2

            # Price range
            if abs(float(p.get('price', 0)) - float(prompt.get('price', 0))) < 10:
                score += 0.1

            scored.append((score, p))

        scored.sort(key=lambda x: x[0], reverse=True)
        result = []
        for score, p in scored[:top_n]:
            p['_sim_score'] = round(score, 4)
            result.append(p)
        return result

    def trending_searches(self, search_log: List[str], top_n: int = 10) -> List[Dict]:
        if not search_log:
            return []
        counter = Counter(search_log)
        total = len(search_log)
        return [
            {'query': q, 'count': c, 'share': round(c / total, 4)}
            for q, c in counter.most_common(top_n)
        ]

    def related_categories(self, category_id: str, prompts: List[Dict]) -> List[Dict]:
        cat_prompts = [p for p in prompts if p.get('categoryId') == category_id]
        if not cat_prompts:
            return []

        co_occurrence = Counter()
        for p in prompts:
            if p.get('categoryId') == category_id:
                continue
            co_occurrence[p.get('categoryId', '')] += 1

        total = sum(co_occurrence.values()) or 1
        return [
            {'categoryId': cid, 'score': round(cnt / total, 4)}
            for cid, cnt in co_occurrence.most_common(5)
        ]
