import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from ..config import FRAUD_THRESHOLDS
from ..utils.scoring import sigmoid, weighted_score
from .features import FeatureExtractor


class PaymentRiskScorer:
    """Real-time payment fraud risk scoring.
    Evaluates transaction risk based on user behavior, device signals,
    and transaction patterns.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()

    def score_transaction(
        self,
        order: Dict,
        buyer: Optional[Dict] = None,
        recent_orders: Optional[List[Dict]] = None,
        prompt: Optional[Dict] = None,
        ip_reputation: Optional[float] = None,
    ) -> Dict:
        signals = []
        risk_score = 0.0
        amount = float(order.get('amount', 0))

        # --- Amount checks ---
        if amount > 0:
            if amount > 200:
                signals.append(('high_amount', min(0.05 * math.log10(amount / 10), 0.4),
                               f'Transaction amount ${amount:.2f}'))

        if order.get('isFree'):
            return {'risk_score': 0.0, 'risk_level': 'low', 'signals': [],
                    'action': 'approve', 'reason': 'Free transaction'}

        # --- Coupon abuse ---
        if order.get('couponCode'):
            signals.append(('has_coupon', 0.05, 'Coupon applied'))

        # --- Buyer checks ---
        if buyer:
            bf = self.feature_extractor.user_features(buyer)

            if bf['account_age_days'] < 0.01:
                signals.append(('new_buyer', 0.3, 'Buyer account created moments ago'))
            elif bf['account_age_days'] < 0.5:
                signals.append(('recent_buyer', 0.15, 'Buyer account less than 12 hours old'))

            if bf['total_spent'] < 0.05 and amount > 50:
                signals.append(('first_large_purchase', 0.2, 'First purchase over $50'))

            if bf['is_temp_email'] > 0:
                signals.append(('temp_email', 0.5, 'Buyer using disposable email'))

        # --- Velocity checks ---
        if recent_orders and len(recent_orders) >= 2:
            times = []
            for o in recent_orders:
                t = o.get('createdAt', '')
                if t:
                    try:
                        dt = datetime.fromisoformat(t.replace('Z', '+00:00'))
                        times.append(dt)
                    except:
                        pass

            if len(times) >= 2:
                intervals = [(times[i+1] - times[i]).total_seconds() / 60
                            for i in range(len(times)-1)]
                min_interval = min(intervals) if intervals else 999
                if min_interval < 2:
                    signals.append(('rapid_orders', 0.4, f'Orders {min_interval:.0f} min apart'))
                elif min_interval < 10:
                    signals.append(('fast_orders', 0.15, f'Orders {min_interval:.0f} min apart'))

            same_prompt_count = sum(1 for o in recent_orders
                                   if o.get('promptId') == order.get('promptId'))
            if same_prompt_count >= 2:
                signals.append(('repeat_purchase', 0.1, f'Prompt purchased {same_prompt_count+1} times'))

        # --- Refund rate ---
        if buyer and recent_orders:
            total_paid = [o for o in recent_orders if float(o.get('amount', 0)) > 0]
            refunded = [o for o in recent_orders if o.get('status') == 'REFUNDED']
            if total_paid and refunded:
                refund_rate = len(refunded) / len(total_paid)
                if refund_rate > 0.3:
                    signals.append(('high_refund_rate', 0.35, f'{refund_rate:.0%} refund rate'))

        # --- IP/Device (simplified) ---
        if ip_reputation is not None and ip_reputation < 0.3:
            signals.append(('low_ip_reputation', 0.3, f'IP reputation {ip_reputation:.2f}'))

        # --- Prompt-Seller risk ---
        if prompt:
            seller = prompt.get('seller', {}) or {}
            if not seller.get('isVerified'):
                signals.append(('unverified_seller', 0.1, 'Seller is not verified'))
            if float(seller.get('totalEarnings', 0)) < 10 and amount > 20:
                signals.append(('new_seller_high_value', 0.15, 'New seller with high-value order'))

        # --- Calculate final score ---
        risk_score = sum(s[1] for s in signals)
        risk_score = min(risk_score, 1.0)

        level = self._risk_level(risk_score)
        action = self._recommend_action(risk_score, amount)

        return {
            'risk_score': round(risk_score, 4),
            'risk_level': level,
            'action': action,
            'reason': signals[-1][2] if signals else 'No risk factors',
            'signals': signals,
            'signals_count': len(signals),
        }

    def score_payout(
        self,
        payout: Dict,
        seller: Optional[Dict] = None,
        recent_payouts: Optional[List[Dict]] = None,
    ) -> Dict:
        signals = []
        amount = float(payout.get('amount', 0))

        if amount > 1000:
            signals.append(('high_payout', 0.2, f'Payout ${amount:.2f}'))

        if seller:
            bf = self.feature_extractor.user_features(seller)
            if bf['account_age_days'] < 7/365:
                signals.append(('new_seller_payout', 0.3, 'Seller account very new'))
            if not bf['has_bank_info']:
                signals.append(('no_bank_info', 0.4, 'No bank/payment info on file'))

        if recent_payouts:
            total_recent = sum(float(p.get('amount', 0)) for p in recent_payouts)
            if total_recent + amount > 5000:
                signals.append(('high_payout_velocity', 0.25, f'Total recent payouts ${total_recent+amount:.0f}'))

        risk_score = sum(s[1] for s in signals)
        risk_score = min(risk_score, 1.0)
        level = self._risk_level(risk_score)

        return {
            'risk_score': round(risk_score, 4),
            'risk_level': level,
            'signals': signals,
            'action': self._recommend_action(risk_score, amount, is_payout=True),
        }

    def _risk_level(self, score: float) -> str:
        if score >= FRAUD_THRESHOLDS['payment_high_risk']:
            return 'high'
        elif score >= FRAUD_THRESHOLDS['payment_medium_risk']:
            return 'medium'
        return 'low'

    def _recommend_action(self, risk_score: float, amount: float, is_payout: bool = False) -> str:
        if risk_score >= FRAUD_THRESHOLDS['payment_high_risk']:
            return 'block' if not is_payout else 'hold'
        elif risk_score >= FRAUD_THRESHOLDS['payment_medium_risk']:
            return 'review' if amount > 100 else 'allow_with_monitoring'
        return 'approve'
