import math
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from ..config import SEARCH_WEIGHTS
from ..utils.text import tokenize, text_similarity, compute_tf, compute_idf, extract_keywords
from ..utils.scoring import exponential_decay, min_max_normalize, weighted_score, sigmoid
from .features import FeatureExtractor


class SearchEngine:
    """AI-powered search ranking engine.
    Combines relevance, popularity, recency, seller authority, and personalization.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self._idf: Dict[str, float] = {}
        self._model = None
        self._util = None
        try:
            from sentence_transformers import SentenceTransformer, util
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            self._util = util
        except ImportError:
            pass

    def build_idf(self, documents: List[Dict]) -> None:
        texts = []
        for doc in documents:
            parts = [
                doc.get('title', ''),
                doc.get('description', ''),
                doc.get('tags', ''),
            ]
            texts.append(' '.join(parts))
        from ..utils.text import compute_idf as _compute_idf
        self._idf = _compute_idf(texts)

    def rank(
        self,
        query: str,
        prompts: List[Dict],
        user: Optional[Dict] = None,
    ) -> List[Dict]:
        if not query or not prompts:
            return prompts

        query_tokens = set(tokenize(query))
        if not query_tokens:
            return prompts

        query_embedding = None
        if self._model:
            query_embedding = self._model.encode(query, convert_to_tensor=True)

        scored = []
        for prompt in prompts:
            scores = self._score_prompt(query, query_tokens, prompt, user, query_embedding)
            combined = weighted_score(scores, SEARCH_WEIGHTS)
            scored.append((combined, prompt, scores))

        scored.sort(key=lambda x: x[0], reverse=True)

        result = []
        for score, prompt, breakdown in scored:
            prompt['_ai_score'] = round(score, 4)
            prompt['_ai_breakdown'] = {k: round(v, 4) for k, v in breakdown.items()}
            result.append(prompt)

        return result

    def _score_prompt(
        self,
        query: str,
        query_tokens: set,
        prompt: Dict,
        user: Optional[Dict],
        query_embedding: Optional[Any] = None
    ) -> Dict[str, float]:
        title = prompt.get('title', '')
        description = prompt.get('description', '')
        tags_raw = prompt.get('tags', '')
        if isinstance(tags_raw, str):
            try:
                tags_list = json.loads(tags_raw)
                tags_text = ' '.join(tags_list) if isinstance(tags_list, list) else tags_raw
            except:
                tags_text = tags_raw
        else:
            tags_text = ' '.join(tags_raw) if isinstance(tags_raw, list) else str(tags_raw)

        combined_text = f"{title} {description} {tags_text}"
        doc_tokens = set(tokenize(combined_text))

        # --- Relevance ---
        exact_title_match = 1.0 if query.lower() in title.lower() else 0.0
        token_overlap = len(query_tokens & doc_tokens) / max(len(query_tokens), 1)
        title_overlap = len(query_tokens & set(tokenize(title))) / max(len(query_tokens), 1)
        
        if self._model and query_embedding is not None:
            doc_embedding = self._model.encode(combined_text, convert_to_tensor=True)
            text_sim = float(self._util.cos_sim(query_embedding, doc_embedding)[0][0])
            text_sim = max(0.0, text_sim)
        else:
            text_sim = text_similarity(query, combined_text)
            
        relevance = 0.3 * exact_title_match + 0.3 * title_overlap + 0.2 * token_overlap + 0.2 * text_sim

        # --- Popularity ---
        view_count = int(prompt.get('viewCount', 0))
        like_count = int(prompt.get('likeCount', 0))
        download_count = int(prompt.get('downloadCount', 0))
        review_count = int(prompt.get('reviewCount', 0))
        rating = float(prompt.get('rating', 0))

        pop_score = (
            0.25 * sigmoid(view_count / 100, 0.5) +
            0.25 * sigmoid(like_count / 50, 0.5) +
            0.20 * sigmoid(download_count / 50, 0.5) +
            0.10 * sigmoid(review_count / 20, 0.5) +
            0.20 * (rating / 5.0)
        )

        # --- Recency ---
        created_at = prompt.get('createdAt', '')
        age_hours = self._age_hours(created_at)
        recency = exponential_decay(age_hours, half_life=168.0)

        # --- Seller Authority ---
        seller = prompt.get('seller', {}) or {}
        is_verified = 1.0 if seller.get('isVerified') else 0.0
        earnings = min(float(seller.get('totalEarnings', 0)) / 5000, 1.0)
        seller_authority = 0.5 * is_verified + 0.3 * earnings + 0.2 * (1.0 if seller.get('isSeller') else 0.0)

        # --- Quality ---
        pf = self.feature_extractor.prompt_features(prompt)
        quality = (
            0.20 * pf['desc_length'] +
            0.20 * pf['prompt_text_length'] +
            0.15 * pf['tag_count'] +
            0.15 * pf['has_images'] +
            0.10 * pf['has_recommended_ai'] +
            0.10 * (1.0 - pf['price_normalized']) +
            0.10 * pf['view_count']
        )

        # --- Personalization ---
        personalization = 0.0
        if user:
            cat_match = 0.0
            if prompt.get('categoryId') and user.get('id'):
                cat_match = 0.5
            personalization = cat_match

        return {
            'relevance': relevance,
            'popularity': pop_score,
            'recency': recency,
            'seller_authority': seller_authority,
            'quality': quality,
            'personalization': personalization,
        }

    def _age_hours(self, date_str: str) -> float:
        if not date_str:
            return 8760
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return (datetime.now(timezone.utc) - dt).total_seconds() / 3600
        except:
            return 8760

    def suggest_queries(self, partial: str, prompts: List[Dict], top_n: int = 5) -> List[str]:
        partial_lower = partial.lower()
        suggestions = []
        seen = set()
        for p in prompts:
            title = p.get('title', '')
            if partial_lower in title.lower() and title.lower() not in seen:
                suggestions.append(title[:80])
                seen.add(title.lower())
            tags_raw = p.get('tags', '[]')
            if isinstance(tags_raw, str):
                try:
                    tags = json.loads(tags_raw)
                    if isinstance(tags, list):
                        for t in tags:
                            if partial_lower in t.lower() and t.lower() not in seen:
                                suggestions.append(t[:80])
                                seen.add(t.lower())
                except:
                    pass
        return suggestions[:top_n]

    def expand_query(self, query: str) -> List[str]:
        keywords = extract_keywords(query)
        expansions = []
        synonym_map = {
            'chatgpt': ['gpt', 'openai', 'chat gpt', 'gpt-4'],
            'midjourney': ['mj', 'mid journey', 'ai art', 'image generation'],
            'coding': ['programming', 'code', 'development', 'software'],
            'writing': ['content', 'copywriting', 'creative writing'],
            'marketing': ['seo', 'social media', 'advertising', 'copy'],
            'business': ['entrepreneur', 'startup', 'strategy'],
            'education': ['learning', 'teaching', 'tutorial', 'course'],
            'music': ['audio', 'song', 'sound', 'melody'],
        }
        for kw in keywords:
            if kw in synonym_map:
                expansions.extend(synonym_map[kw])
        return list(set(expansions))
