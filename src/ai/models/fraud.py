import re
import json
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

from ..config import FRAUD_THRESHOLDS
from ..utils.text import tokenize, text_similarity
from ..utils.scoring import weighted_score, sigmoid, entropy
from .features import FeatureExtractor


class FraudDetector:
    """Fraud detection for users, prompts, and reviews.
    Uses behavioral signals, content analysis, and anomaly detection.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self._known_fraud_patterns = self._load_patterns()

    def _load_patterns(self) -> Dict:
        return {
            'spam_keywords': [
                'buy now', 'click here', 'limited time', 'act now',
                'free money', 'earn fast', 'double your', 'work from home',
                'make money', 'instant', 'guaranteed', 'miracle', 'secret',
            ],
            'suspicious_tlds': {'.xyz', '.top', '.loan', '.work', '.click', '.date', '.review'},
            'generated_phrases': [
                'as an ai language model', 'i cannot provide', 'i apologize',
                'as a responsible', 'i must inform', 'as an assistant',
            ],
        }

    def check_user(self, user: dict, existing_users: Optional[List[dict]] = None) -> Dict:
        signals = []
        risk_score = 0.0
        features = self.feature_extractor.user_features(user)

        # --- Account Age ---
        if features['account_age_days'] < 0.01:
            signals.append(('new_account', 0.3, 'Account created moments ago'))
        elif features['account_age_days'] < 0.1:
            signals.append(('very_new_account', 0.15, 'Account less than 2.4 hours old'))

        # --- Profile Completeness ---
        completeness = (
            features['has_avatar'] * 0.3 +
            features['has_bio'] * 0.3 +
            features['has_bank_info'] * 0.4
        )
        if completeness < 0.2 and features['is_seller'] > 0:
            signals.append(('incomplete_seller_profile', 0.25, 'Seller with minimal profile info'))

        # --- Email ---
        if features['is_temp_email'] > 0:
            signals.append(('temp_email', 0.5, 'Disposable email address'))
        if features['email_provider_score'] < 0.3:
            signals.append(('suspicious_email', 0.15, 'Uncommon email provider'))

        # --- Name ---
        if features['has_numeric_name'] > 0:
            signals.append(('numeric_name', 0.2, 'Name contains many numbers'))

        # --- Earnings/Spend Ratio ---
        if features['total_earnings'] > 0.5 and features['account_age_days'] < 0.1:
            signals.append(('rapid_earnings', 0.4, 'High earnings from very new account'))

        # --- Similarity to existing users ---
        if existing_users:
            max_sim = 0.0
            for existing in existing_users:
                if existing.get('id') == user.get('id'):
                    continue
                sim = self._user_similarity(user, existing)
                max_sim = max(max_sim, sim)
            if max_sim > 0.85:
                signals.append(('duplicate_account', 0.6, f'High similarity ({max_sim:.0%}) to existing user'))
            elif max_sim > 0.7:
                signals.append(('similar_account', 0.3, f'Moderate similarity ({max_sim:.0%}) to existing user'))

        # --- Calculate final risk ---
        risk_score = sum(s[1] for s in signals)
        risk_score = min(risk_score, 1.0)

        level = self._risk_level(risk_score, 'user')

        return {
            'risk_score': round(risk_score, 4),
            'risk_level': level,
            'signals': signals,
            'features': {k: round(v, 4) for k, v in features.items()},
        }

    def check_prompt(self, prompt: dict, existing_prompts: Optional[List[dict]] = None) -> Dict:
        signals = []
        risk_score = 0.0
        features = self.feature_extractor.prompt_features(prompt)
        title = prompt.get('title', '')
        description = prompt.get('description', '')
        prompt_text = prompt.get('promptText', '')
        combined = f"{title} {description} {prompt_text}".lower()

        # --- Duplicate detection ---
        if existing_prompts:
            max_sim = 0.0
            most_similar = None
            for existing in existing_prompts:
                if existing.get('id') == prompt.get('id'):
                    continue
                e_title = existing.get('title', '')
                e_desc = existing.get('description', '')
                e_text = existing.get('promptText', '')
                sim = text_similarity(f"{title} {description}", f"{e_title} {e_desc}")
                if sim > max_sim:
                    max_sim = sim
                    most_similar = existing.get('title', '')
            if max_sim > 0.85:
                signals.append(('duplicate_content', 0.7, f'High similarity ({max_sim:.0%}) to "{most_similar}"'))
            elif max_sim > 0.65:
                signals.append(('similar_content', 0.35, f'Moderate similarity ({max_sim:.0%}) to "{most_similar}"'))

        # --- Content quality signals ---
        if features['title_length'] < 0.2:
            signals.append(('short_title', 0.2, 'Very short title'))
        if features['desc_length'] < 0.05:
            signals.append(('missing_description', 0.25, 'No or very short description'))
        if features['prompt_text_length'] < 0.05:
            signals.append(('empty_prompt_text', 0.4, 'Prompt text is empty or too short'))

        # --- Spam detection ---
        spam_matches = []
        for pattern in self._known_fraud_patterns['spam_keywords']:
            if pattern in combined:
                spam_matches.append(pattern)
        if spam_matches:
            signals.append(('spam_keywords', min(len(spam_matches) * 0.1, 0.5), f'Contains spam keywords: {spam_matches[:3]}'))

        # --- Price anomalies ---
        if features['is_free'] == 0 and features['price_normalized'] > 0.8:
            if features['desc_length'] < 0.3 or features['prompt_text_length'] < 0.3:
                signals.append(('overpriced_low_quality', 0.3, 'High price with minimal content'))

        # --- AI-generated content detection ---
        gen_matches = []
        for phrase in self._known_fraud_patterns['generated_phrases']:
            if phrase in combined:
                gen_matches.append(phrase)
        if gen_matches:
            signals.append(('ai_generated_text', 0.3, 'Contains AI-generated text patterns'))

        # --- Excessive formatting ---
        cap_ratio = sum(1 for c in description if c.isupper()) / max(len(description), 1)
        if cap_ratio > 0.5 and len(description) > 50:
            signals.append(('excessive_caps', 0.15, 'Description has >50% uppercase characters'))

        # --- Price outliers ---
        if features['price_normalized'] > 0.9 and features['view_count'] < 0.01:
            signals.append(('high_price_no_engagement', 0.2, 'High price with no engagement'))

        risk_score = sum(s[1] for s in signals)
        risk_score = min(risk_score, 1.0)

        level = self._risk_level(risk_score, 'prompt')

        return {
            'risk_score': round(risk_score, 4),
            'risk_level': level,
            'signals': signals,
            'features': {k: round(v, 4) for k, v in features.items()},
        }

    def check_review(self, review: dict, user_reviews: Optional[List[dict]] = None) -> Dict:
        signals = []
        features = self.feature_extractor.review_features(review)
        comment = review.get('comment', '')
        rating = review.get('rating', 3)

        # --- Review text analysis ---
        if features['comment_length'] < 0.05:
            signals.append(('empty_review', 0.3, 'Review contains no meaningful text'))
        if features['all_caps_ratio'] > 0.5 and len(comment) > 20:
            signals.append(('all_caps_review', 0.2, 'Review is mostly uppercase'))
        if features['has_duplicate_pattern'] > 0:
            signals.append(('generated_review', 0.4, 'Review appears to be AI-generated or templated'))

        # --- Rating anomalies ---
        if rating == 5 and features['comment_length'] < 0.1:
            signals.append(('suspicious_5_star', 0.2, '5-star rating with no explanation'))
        if rating == 1 and features['comment_length'] < 0.1:
            signals.append(('suspicious_1_star', 0.2, '1-star rating with no explanation'))

        # --- User review history ---
        if user_reviews:
            same_rating_ratio = sum(1 for r in user_reviews if r.get('rating') == rating) / max(len(user_reviews), 1)
            if same_rating_ratio > 0.8 and len(user_reviews) >= 3:
                signals.append(('uniform_rating', 0.25, f'{same_rating_ratio:.0%} of reviews have same rating'))

            avg_comment_len = sum(len(r.get('comment', '')) for r in user_reviews) / max(len(user_reviews), 1)
            if avg_comment_len < 20 and len(comment) < 20 and len(user_reviews) >= 3:
                signals.append(('consistently_short', 0.15, 'All reviews are very short'))

        risk_score = sum(s[1] for s in signals)
        risk_score = min(risk_score, 1.0)

        level = self._risk_level(risk_score, 'review')

        return {
            'risk_score': round(risk_score, 4),
            'risk_level': level,
            'signals': signals,
            'features': {k: round(v, 4) for k, v in features.items()},
        }

    def check_transaction_pattern(self, orders: List[dict]) -> Dict:
        signals = []
        if len(orders) < 2:
            return {'risk_score': 0.0, 'risk_level': 'low', 'signals': [], 'order_count': len(orders)}

        amounts = [float(o.get('amount', 0)) for o in orders]
        times = []
        for o in orders:
            t = o.get('createdAt', '')
            if t:
                try:
                    dt = datetime.fromisoformat(t.replace('Z', '+00:00'))
                    times.append(dt)
                except:
                    pass

        # --- Velocity ---
        if times and len(times) >= 3:
            intervals = [(times[i+1] - times[i]).total_seconds() / 60 for i in range(len(times)-1)]
            avg_interval = sum(intervals) / len(intervals)
            if avg_interval < 5:
                signals.append(('high_velocity', 0.5, f'Orders every {avg_interval:.0f} minutes'))

        # --- Amount anomalies ---
        if amounts:
            mu = sum(amounts) / len(amounts)
            variance = sum((a - mu)**2 for a in amounts) / len(amounts)
            std = math.sqrt(variance) if variance > 0 else 1
            for amt in amounts:
                z = abs(amt - mu) / max(std, 0.01)
                if z > 3:
                    signals.append(('amount_outlier', 0.3, f'Order amount ${amt:.2f} is {z:.1f} std devs from mean'))

        risk_score = sum(s[1] for s in signals)
        risk_score = min(risk_score, 1.0)
        level = self._risk_level(risk_score, 'payment')

        return {
            'risk_score': round(risk_score, 4),
            'risk_level': level,
            'signals': signals,
            'order_count': len(orders),
        }

    def _user_similarity(self, a: dict, b: dict) -> float:
        fields = ['name', 'email', 'bio']
        sims = []
        for field in fields:
            va = str(a.get(field, '')).lower().strip()
            vb = str(b.get(field, '')).lower().strip()
            if va and vb:
                sims.append(text_similarity(va, vb))
        return max(sims) if sims else 0.0

    def _risk_level(self, score: float, context: str) -> str:
        high = FRAUD_THRESHOLDS.get(f'{context}_high_risk', 0.7)
        medium = FRAUD_THRESHOLDS.get(f'{context}_medium_risk', 0.4)
        if score >= high:
            return 'high'
        elif score >= medium:
            return 'medium'
        return 'low'
