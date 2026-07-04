import math
import statistics
from typing import List, Dict, Any


def min_max_normalize(values: List[float]) -> List[float]:
    if not values:
        return []
    mn, mx = min(values), max(values)
    if mx == mn:
        return [0.5] * len(values)
    return [(v - mn) / (mx - mn) for v in values]


def z_score_normalize(values: List[float]) -> List[float]:
    if len(values) < 2:
        return [0.5] * len(values)
    mu = statistics.mean(values)
    sigma = statistics.stdev(values)
    if sigma == 0:
        return [0.5] * len(values)
    return [(v - mu) / (sigma * 2) + 0.5 for v in values]


def sigmoid(x: float, k: float = 1.0) -> float:
    return 1.0 / (1.0 + math.exp(-k * x))


def weighted_score(scores: Dict[str, float], weights: Dict[str, float]) -> float:
    total = 0.0
    weight_sum = 0.0
    for key, weight in weights.items():
        if key in scores:
            total += scores[key] * weight
            weight_sum += weight
    return total / weight_sum if weight_sum > 0 else 0.0


def exponential_decay(age_hours: float, half_life: float = 72.0) -> float:
    return math.exp(-math.log(2) * age_hours / half_life)


def percentile_rank(value: float, distribution: List[float]) -> float:
    if not distribution:
        return 0.5
    count_less = sum(1 for v in distribution if v < value)
    return count_less / len(distribution)


def entropy(probabilities: List[float]) -> float:
    probs = [p for p in probabilities if p > 0]
    if not probs:
        return 0.0
    total = sum(probs)
    normalized = [p / total for p in probs]
    return -sum(p * math.log2(p) for p in normalized)


def kl_divergence(p: List[float], q: List[float]) -> float:
    epsilon = 1e-10
    divergence = 0.0
    for pi, qi in zip(p, q):
        pi = max(pi, epsilon)
        qi = max(qi, epsilon)
        divergence += pi * math.log(pi / qi)
    return divergence


def feature_hash(features: Dict[str, float], num_buckets: int = 1024) -> List[float]:
    result = [0.0] * num_buckets
    for key, val in features.items():
        bucket = hash(key) % num_buckets
        result[bucket] += val
    return result


def smooth_outliers(values: List[float], threshold: float = 3.0) -> List[float]:
    if len(values) < 4:
        return values
    mu = statistics.mean(values)
    sigma = statistics.stdev(values)
    if sigma == 0:
        return values
    result = []
    for v in values:
        z = abs(v - mu) / sigma
        if z > threshold:
            result.append(mu + threshold * sigma * (1 if v > mu else -1))
        else:
            result.append(v)
    return result
