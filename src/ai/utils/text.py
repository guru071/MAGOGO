import re
import math
from collections import Counter
from typing import List

STOP_WORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'by', 'with', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'me',
    'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they',
    'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who',
    'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'because', 'about', 'up', 'out', 'if', 'while',
    'also', 'just', 'like', 'get', 'one', 'two', 'use',
}


def tokenize(text: str) -> List[str]:
    text = text.lower()
    tokens = re.findall(r'\b[a-z0-9]+\b', text)
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]


def ngrams(tokens: List[str], n: int = 2) -> List[str]:
    return [' '.join(tokens[i:i+n]) for i in range(len(tokens)-n+1)]


def compute_tf(text: str) -> dict:
    tokens = tokenize(text)
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = len(tokens)
    return {word: count / total for word, count in counts.items()}


def compute_idf(documents: List[str], smooth: bool = True) -> dict:
    n = len(documents)
    df: Counter = Counter()
    for doc in documents:
        unique = set(tokenize(doc))
        for word in unique:
            df[word] += 1
    idf = {}
    for word, count in df.items():
        idf[word] = math.log((n + 1) / (count + 1)) + 1 if smooth else math.log(n / count)
    return idf


def cosine_similarity(vec_a: dict, vec_b: dict) -> float:
    common = set(vec_a) & set(vec_b)
    if not common:
        return 0.0
    dot = sum(vec_a[w] * vec_b[w] for w in common)
    norm_a = math.sqrt(sum(v*v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v*v for v in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    tokens = tokenize(text)
    if not tokens:
        return []
    freq = Counter(tokens)
    return [w for w, _ in freq.most_common(top_n)]


def text_similarity(a: str, b: str) -> float:
    tokens_a = set(tokenize(a))
    tokens_b = set(tokenize(b))
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return len(intersection) / len(union)


def prompt_text_features(text: str) -> dict:
    tokens = tokenize(text)
    return {
        'word_count': len(tokens),
        'char_count': len(text),
        'unique_ratio': len(set(tokens)) / max(len(tokens), 1),
        'avg_word_len': sum(len(t) for t in tokens) / max(len(tokens), 1),
        'sentence_count': len(re.findall(r'[.!?]+', text)),
        'has_code_block': 1 if re.search(r'```', text) else 0,
        'has_examples': 1 if re.search(r'(example|e\.g\.|for instance|such as)', text.lower()) else 0,
        'has_steps': 1 if re.search(r'(step \d|first|second|then|finally|\d+\.\s)', text.lower()) else 0,
    }
