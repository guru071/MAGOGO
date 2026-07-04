import re
import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from collections import Counter

from ..utils.text import tokenize
from ..config import MAX_FEATURES


class FeatureExtractor:
    def user_features(self, user: dict) -> Dict[str, float]:
        features = {}
        created_at = user.get('createdAt') or user.get('created_at', '')
        age_days = self._days_ago(created_at)

        features['account_age_days'] = min(age_days, 365) / 365
        features['is_verified'] = 1.0 if user.get('isVerified') else 0.0
        features['has_avatar'] = 1.0 if user.get('avatar') else 0.0
        features['has_bio'] = 1.0 if user.get('bio') else 0.0
        features['is_seller'] = 1.0 if user.get('isSeller') else 0.0
        features['has_bank_info'] = 1.0 if (
            user.get('bankName') or user.get('bankAccount') or
            user.get('upiId') or user.get('paypalEmail')
        ) else 0.0
        features['role_score'] = 1.0 if user.get('role') == 'ADMIN' else 0.5 if user.get('role') == 'SELLER' else 0.0
        features['total_earnings'] = min(float(user.get('totalEarnings', 0)) / 10000, 1.0)
        features['total_spent'] = min(float(user.get('totalSpent', 0)) / 5000, 1.0)
        features['is_online'] = 1.0 if user.get('isOnline') else 0.0

        email = user.get('email', '')
        features['is_temp_email'] = 1.0 if self._is_temp_email(email) else 0.0
        features['email_provider_score'] = self._email_provider_score(email)
        features['has_numeric_name'] = 1.0 if re.search(r'\d{4,}', user.get('name', '')) else 0.0

        return features

    def prompt_features(self, prompt: dict) -> Dict[str, float]:
        features = {}
        title = prompt.get('title', '')
        description = prompt.get('description', '')
        prompt_text = prompt.get('promptText', '')
        tags_raw = prompt.get('tags', '[]')
        prices = prompt.get('price', 0)

        if isinstance(tags_raw, str):
            import json
            try: tags = json.loads(tags_raw)
            except: tags = tags_raw.split(',') if tags_raw else []
        else:
            tags = tags_raw or []

        title_tokens = tokenize(title)
        desc_tokens = tokenize(description)
        text_tokens = tokenize(prompt_text)

        features['title_length'] = min(len(title_tokens) / 20, 1.0)
        features['desc_length'] = min(len(desc_tokens) / 100, 1.0)
        features['prompt_text_length'] = min(len(text_tokens) / 500, 1.0)
        features['has_images'] = 1.0 if (
            prompt.get('sampleImages') and
            prompt['sampleImages'] not in ('[]', 'null', '')
        ) else 0.0
        features['tag_count'] = min(len(tags) / 10, 1.0)
        features['has_recommended_ai'] = 1.0 if prompt.get('recommendedAI') else 0.0
        features['is_free'] = 1.0 if prompt.get('isFree') else 0.0
        features['has_discount'] = 1.0 if float(prompt.get('discount', 0)) > 0 else 0.0
        features['price_normalized'] = min(float(prices) / 100, 1.0)
        features['is_featured'] = 1.0 if prompt.get('isFeatured') else 0.0
        features['is_trending'] = 1.0 if prompt.get('isTrending') else 0.0
        features['is_premium'] = 1.0 if prompt.get('isPremium') else 0.0
        features['view_count'] = min(int(prompt.get('viewCount', 0)) / 1000, 1.0)
        features['like_count'] = min(int(prompt.get('likeCount', 0)) / 100, 1.0)
        features['download_count'] = min(int(prompt.get('downloadCount', 0)) / 100, 1.0)

        return features

    def review_features(self, review: dict) -> Dict[str, float]:
        features = {}
        comment = review.get('comment', '')
        comment_tokens = tokenize(comment)

        features['comment_length'] = min(len(comment_tokens) / 100, 1.0)
        features['rating_score'] = float(review.get('rating', 3)) / 5.0
        features['has_verified_purchase'] = 1.0 if review.get('isVerifiedPurchase') else 0.0
        features['has_duplicate_pattern'] = 1.0 if self._looks_generated(comment) else 0.0
        features['all_caps_ratio'] = self._all_caps_ratio(comment)

        return features

    def order_features(self, order: dict, user: Optional[dict] = None) -> Dict[str, float]:
        features = {}
        amount = float(order.get('amount', 0))
        created_at = order.get('createdAt') or order.get('created_at', '')

        features['amount_normalized'] = min(amount / 1000, 1.0)
        features['is_free'] = 1.0 if order.get('isFree') else 0.0
        features['hour_of_day'] = self._hour_of_day(created_at) / 24.0
        features['day_of_week'] = self._day_of_week(created_at) / 7.0
        features['has_coupon'] = 1.0 if order.get('couponCode') else 0.0
        features['platform_fee_ratio'] = min(
            float(order.get('platformFee', 0)) / max(amount, 0.01), 1.0
        )

        if user:
            uf = self.user_features(user)
            features['buyer_account_age'] = uf.get('account_age_days', 0.5)
            features['buyer_is_verified'] = uf.get('is_verified', 0.0)
            features['buyer_total_spent'] = uf.get('total_spent', 0.0)

        return features

    def _days_ago(self, date_str: str) -> float:
        if not date_str:
            return 365
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
        except:
            return 365

    def _is_temp_email(self, email: str) -> bool:
        temp_domains = {
            'tempmail', 'throwaway', 'guerrillamail', 'sharklasers',
            'mailinator', 'yopmail', '10minutemail', 'trashmail',
            'temp-mail', 'fakeinbox', 'mailnator', 'dispostable',
            'getairmail', 'spamgourmet', 'mailcatch',
        }
        domain = email.split('@')[-1].split('.')[0].lower()
        return domain in temp_domains

    def _email_provider_score(self, email: str) -> float:
        trusted = {'gmail.com': 1.0, 'outlook.com': 0.9, 'hotmail.com': 0.8,
                   'yahoo.com': 0.8, 'protonmail.com': 0.7, 'icloud.com': 0.9}
        domain = email.split('@')[-1].lower()
        return trusted.get(domain, 0.3)

    def _looks_generated(self, text: str) -> bool:
        repeated_patterns = [
            r'(great|amazing|excellent|wonderful)\s+(prompt|product|item)',
            r'(highly|strongly)\s+recommend',
            r'(best|top)\s+(prompt|product|quality)',
            r'i\s+(bought|purchased|got)\s+(this|the)',
        ]
        matches = sum(1 for p in repeated_patterns if re.search(p, text.lower()))
        return matches >= 3

    def _all_caps_ratio(self, text: str) -> float:
        if not text.strip():
            return 0.0
        words = text.split()
        if not words:
            return 0.0
        caps = sum(1 for w in words if w.isupper() and len(w) > 1)
        return caps / len(words)

    def _hour_of_day(self, date_str: str) -> float:
        if not date_str:
            return 12
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.hour + dt.minute / 60.0
        except:
            return 12

    def _day_of_week(self, date_str: str) -> float:
        if not date_str:
            return 3
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.weekday()
        except:
            return 3
