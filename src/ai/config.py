import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL', '')
REDIS_URL = os.getenv('REDIS_URL', '')

# Model paths
MODEL_DIR = Path(__file__).parent / 'models' / 'weights'
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Search
SEARCH_WEIGHTS = {
    'relevance': 0.35,
    'popularity': 0.20,
    'recency': 0.10,
    'seller_authority': 0.15,
    'quality': 0.10,
    'personalization': 0.10,
}

# Fraud thresholds
FRAUD_THRESHOLDS = {
    'user_high_risk': 0.85,
    'user_medium_risk': 0.55,
    'prompt_high_risk': 0.80,
    'prompt_medium_risk': 0.50,
    'review_high_risk': 0.75,
    'review_medium_risk': 0.45,
    'payment_high_risk': 0.80,
    'payment_medium_risk': 0.50,
}

# Scoring
QUALITY_WEIGHTS = {
    'description_length': 0.15,
    'prompt_text_length': 0.20,
    'has_tags': 0.10,
    'has_images': 0.10,
    'has_recommended_ai': 0.05,
    'price_reasonableness': 0.10,
    'seller_reputation': 0.15,
    'engagement': 0.15,
}

# Vector dims
EMBEDDING_DIM = 384
MAX_FEATURES = 5000
