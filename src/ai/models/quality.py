import re
import json
from typing import Dict, Any, List, Optional

from ..config import QUALITY_WEIGHTS
from ..utils.text import tokenize, prompt_text_features
from ..utils.scoring import weighted_score, sigmoid
from .features import FeatureExtractor


class ContentQualityScorer:
    """Content quality scoring for prompts.
    Evaluates completeness, structure, pricing, and engagement signals.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()

    def score_prompt(self, prompt: dict, category_avg_price: Optional[float] = None) -> Dict:
        scores = {}
        features = self.feature_extractor.prompt_features(prompt)
        text_features = prompt_text_features(prompt.get('promptText', ''))

        # --- Description Quality ---
        desc = prompt.get('description', '')
        desc_tokens = tokenize(desc)
        if len(desc_tokens) >= 50:
            scores['description_length'] = 1.0
        elif len(desc_tokens) >= 20:
            scores['description_length'] = 0.6
        elif len(desc_tokens) >= 5:
            scores['description_length'] = 0.3
        else:
            scores['description_length'] = 0.0

        # --- Prompt Text Quality ---
        prompt_text = prompt.get('promptText', '')
        pt_tokens = tokenize(prompt_text)
        if len(pt_tokens) >= 100:
            scores['prompt_text_length'] = 1.0
        elif len(pt_tokens) >= 50:
            scores['prompt_text_length'] = 0.7
        elif len(pt_tokens) >= 10:
            scores['prompt_text_length'] = 0.4
        else:
            scores['prompt_text_length'] = 0.0

        # Structure bonus
        structure_bonus = (
            text_features['has_code_block'] * 0.3 +
            text_features['has_examples'] * 0.3 +
            text_features['has_steps'] * 0.4
        )
        scores['prompt_text_length'] = min(scores['prompt_text_length'] + structure_bonus * 0.2, 1.0)

        # --- Tags ---
        scores['has_tags'] = features['tag_count']

        # --- Images ---
        scores['has_images'] = features['has_images']

        # --- Recommended AI ---
        scores['has_recommended_ai'] = features['has_recommended_ai']

        # --- Price Reasonableness ---
        price = float(prompt.get('price', 0))
        if prompt.get('isFree'):
            scores['price_reasonableness'] = 0.5
        elif category_avg_price and category_avg_price > 0:
            ratio = price / category_avg_price
            if 0.5 <= ratio <= 2.0:
                scores['price_reasonableness'] = 1.0
            elif 0.2 <= ratio <= 5.0:
                scores['price_reasonableness'] = 0.6
            else:
                scores['price_reasonableness'] = 0.2
        else:
            scores['price_reasonableness'] = (
                1.0 if price < 50 else
                0.7 if price < 100 else
                0.4 if price < 200 else
                0.2
            )

        # --- Seller Reputation ---
        seller = prompt.get('seller', {}) or {}
        seller_reviews = sum(
            1 for r in prompt.get('reviews', [])
            if r.get('rating', 0) >= 4
        )
        total_reviews = len(prompt.get('reviews', [])) or 1
        scores['seller_reputation'] = (
            0.3 * (1.0 if seller.get('isVerified') else 0.0) +
            0.3 * min(float(seller.get('totalEarnings', 0)) / 5000, 1.0) +
            0.2 * sigmoid(seller_reviews / total_reviews * 5, 2.0) +
            0.2 * (1.0 if seller.get('isSeller') else 0.0)
        )

        # --- Engagement ---
        view_count = int(prompt.get('viewCount', 0))
        like_count = int(prompt.get('likeCount', 0))
        download_count = int(prompt.get('downloadCount', 0))
        rating = float(prompt.get('rating', 0))

        scores['engagement'] = (
            0.20 * sigmoid(view_count / 500, 0.3) +
            0.25 * sigmoid(like_count / 200, 0.3) +
            0.25 * sigmoid(download_count / 200, 0.3) +
            0.20 * (rating / 5.0) +
            0.10 * sigmoid(len(prompt.get('reviews', [])), 0.5)
        )

        # --- Title Quality ---
        title = prompt.get('title', '')
        title_tokens = tokenize(title)
        title_score = 0.5
        if len(title_tokens) >= 3 and len(title_tokens) <= 15:
            title_score = 1.0
        elif len(title_tokens) >= 2:
            title_score = 0.7
        elif not title_tokens:
            title_score = 0.0
        scores['title_quality'] = title_score

        # --- Combined score ---
        combined = weighted_score(scores, QUALITY_WEIGHTS)

        # --- Grade ---
        grade = self._grade(combined)

        # --- Issues ---
        issues = []
        if scores['description_length'] < 0.3:
            issues.append('Short or missing description')
        if scores['prompt_text_length'] < 0.3:
            issues.append('Prompt text is too short or low quality')
        if scores['has_tags'] < 0.3:
            issues.append('No or few tags')
        if scores['has_images'] < 0.3:
            issues.append('No sample images')
        if scores['price_reasonableness'] < 0.3:
            issues.append('Price seems unreasonable')
        if scores['title_quality'] < 0.5:
            issues.append('Title could be improved')

        return {
            'overall_score': round(combined, 4),
            'grade': grade,
            'scores': {k: round(v, 4) for k, v in scores.items()},
            'issues': issues,
            'features': {k: round(v, 4) for k, v in features.items()},
        }

    def score_batch(self, prompts: List[dict]) -> List[Dict]:
        cat_prices = self._category_avg_prices(prompts)
        results = []
        for p in prompts:
            cat_avg = cat_prices.get(p.get('categoryId', ''))
            results.append(self.score_prompt(p, cat_avg))
        return results

    def _grade(self, score: float) -> str:
        if score >= 0.85:
            return 'excellent'
        elif score >= 0.70:
            return 'good'
        elif score >= 0.50:
            return 'average'
        elif score >= 0.30:
            return 'poor'
        return 'very_poor'

    def _category_avg_prices(self, prompts: List[dict]) -> Dict[str, float]:
        cat_prices: Dict[str, list] = {}
        for p in prompts:
            cat = p.get('categoryId', '')
            price = float(p.get('price', 0))
            if price > 0:
                cat_prices.setdefault(cat, []).append(price)
        return {
            cat: sum(prices) / len(prices)
            for cat, prices in cat_prices.items()
        }
