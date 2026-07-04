"""
MAGHGO AI/ML Service
=====================
Production-grade ML service powering:
  - AI search ranking (Google/Amazon-style)
  - Fraud detection (Meta-style)
  - Payment risk scoring (Flipkart/Amazon-style)
  - Recommendations (YouTube-style)
  - Content quality scoring
  - Anomaly detection

Run: uvicorn src.ai.main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Body, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.models import (
    SearchEngine,
    FraudDetector,
    RecommendationEngine,
    PaymentRiskScorer,
    ContentQualityScorer,
    FeatureExtractor,
    ImageFraudDetector,
)
from ai.models.embeddings import get_embedding, get_embedding_status
from ai.data import Database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('maghgo-ai')

# ---------------------------------------------------------------------------
# App State
# ---------------------------------------------------------------------------

class AppState:
    def __init__(self):
        self.db = Database()
        self.search = SearchEngine()
        self.fraud = FraudDetector()
        self.recommend = RecommendationEngine()
        self.payment_risk = PaymentRiskScorer()
        self.quality = ContentQualityScorer()
        self.features = FeatureExtractor()
        self.image_fraud = ImageFraudDetector()
        self._initialized = False

    async def initialize(self):
        if self._initialized:
            return
        logger.info("Initializing AI/ML models...")
        try:
            prompts = self.db.get_active_prompts(limit=5000)
            self.search.build_idf(prompts)
            logger.info(f"Search engine initialized with {len(prompts)} prompts")
        except Exception as e:
            logger.warning(f"Search engine init: {e}")
        self._initialized = True
        logger.info("AI/ML service ready")

state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await state.initialize()
    yield

app = FastAPI(
    title="MAGHGO AI/ML Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    prompts: List[Dict[str, Any]] = Field(default_factory=list)
    user_id: Optional[str] = None
    top_n: int = Field(default=20, ge=1, le=100)

class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

class FraudCheckUserRequest(BaseModel):
    user: Dict[str, Any]
    existing_users: List[Dict[str, Any]] = Field(default_factory=list)

class FraudCheckPromptRequest(BaseModel):
    prompt: Dict[str, Any]
    existing_prompts: List[Dict[str, Any]] = Field(default_factory=list)

class FraudCheckReviewRequest(BaseModel):
    review: Dict[str, Any]
    user_reviews: List[Dict[str, Any]] = Field(default_factory=list)

class RecommendRequest(BaseModel):
    user_id: Optional[str] = None
    prompts: List[Dict[str, Any]] = Field(default_factory=list)
    top_n: int = Field(default=20, ge=1, le=100)

class ScoreTransactionRequest(BaseModel):
    order: Dict[str, Any]
    buyer: Optional[Dict[str, Any]] = None
    recent_orders: List[Dict[str, Any]] = Field(default_factory=list)
    prompt: Optional[Dict[str, Any]] = None

class ScorePayoutRequest(BaseModel):
    payout: Dict[str, Any]
    seller: Optional[Dict[str, Any]] = None
    recent_payouts: List[Dict[str, Any]] = Field(default_factory=list)

class QualityScoreRequest(BaseModel):
    prompt: Dict[str, Any]
    category_avg_price: Optional[float] = None

class BatchQualityRequest(BaseModel):
    prompts: List[Dict[str, Any]]

class SimilarPromptsRequest(BaseModel):
    prompt: Dict[str, Any]
    prompts: List[Dict[str, Any]] = Field(default_factory=list)
    top_n: int = Field(default=6, ge=1, le=20)

class AnomalyRequest(BaseModel):
    orders: List[Dict[str, Any]]


# ---------------------------------------------------------------------------
# Health / Info
# ---------------------------------------------------------------------------

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "service": "maghgo-ai",
        "version": "1.0.0",
        "initialized": state._initialized,
        "models": ["search", "fraud", "recommend", "payment_risk", "quality"],
        "embedding": get_embedding_status(),
    }

@app.get("/api/v1/info")
async def info():
    return {
        "name": "MAGHGO AI/ML Engine",
        "description": "AI-powered search, fraud detection, recommendations, payment risk scoring, and content quality analysis",
        "algorithms": {
            "search": {
                "strategy": "Multi-factor ranking (relevance, popularity, recency, seller authority, quality, personalization)",
                "weights": {
                    "relevance": "TF-IDF cosine similarity + title match + query overlap",
                    "popularity": "Views, likes, downloads, reviews, rating (sigmoid normalized)",
                    "recency": "Exponential decay with 7-day half-life",
                    "seller_authority": "Verification, earnings, seller status",
                    "quality": "Content completeness, structure, pricing",
                    "personalization": "Category affinity based on purchase history",
                },
            },
            "fraud": {
                "strategy": "Multi-signal risk scoring with configurable thresholds",
                "user": ["Account age", "Profile completeness", "Email reputation", "Duplicates", "Behavioral anomalies"],
                "prompt": ["Duplicate detection", "Content quality", "Spam keywords", "Price anomalies", "AI-generated text"],
                "review": ["Review text analysis", "Rating anomalies", "User history patterns"],
                "transaction": ["Velocity", "Amount outliers", "Refund rate", "IP reputation"],
            },
            "recommendations": {
                "strategy": "Hybrid (collaborative + content-based + popularity + exploration)",
                "factors": ["Category affinity", "Wishlist signals", "Content similarity", "Trending score", "Seller quality", "Price affinity"],
            },
            "payment_risk": {
                "strategy": "Real-time transaction scoring with action recommendations",
                "factors": ["Amount", "Buyer history", "Order velocity", "Refund rate", "IP/device signals", "Seller verification"],
                "actions": ["approve", "allow_with_monitoring", "review", "block", "hold"],
            },
            "quality": {
                "strategy": "Multi-dimensional prompt quality evaluation",
                "dimensions": ["Description length", "Prompt text quality", "Tags", "Images", "Price reasonableness", "Seller reputation", "Engagement"],
                "grades": ["excellent", "good", "average", "poor", "very_poor"],
            },
        },
    }


# ---------------------------------------------------------------------------
# Search Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/search/rank")
async def search_rank(req: SearchRequest):
    user = None
    if req.user_id:
        try:
            user = state.db.get_user_by_id(req.user_id)
        except Exception as e:
            logger.warning(f"Failed to load user {req.user_id}: {e}")

    ranked = state.search.rank(req.query, req.prompts, user)

    if req.user_id:
        try:
            state.db.log_search(req.query, req.user_id, len(ranked))
        except Exception as e:
            logger.warning(f"Failed to log search: {e}")

    return {"success": True, "data": ranked[:req.top_n], "total": len(req.prompts)}

@app.post("/api/v1/search/suggest")
async def suggest(
    query: str = Query(..., min_length=1),
    top_n: int = Query(default=5, ge=1, le=20),
):
    try:
        prompts = state.db.get_active_prompts(limit=200)
        suggestions = state.search.suggest_queries(query, prompts, top_n)
        return {"success": True, "data": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/search/expand")
async def expand(query: str = Query(..., min_length=1)):
    expanded = state.search.expand_query(query)
    return {"success": True, "data": expanded, "original": query}

@app.post("/api/v1/embed")
async def generate_embedding(req: EmbedRequest):
    try:
        vector = get_embedding(req.text)
        return {"success": True, "data": vector}
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate embedding")


# ---------------------------------------------------------------------------
# Fraud Detection Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/fraud/check-user")
async def fraud_check_user(req: FraudCheckUserRequest):
    result = state.fraud.check_user(req.user, req.existing_users)
    return {"success": True, "data": result}

@app.post("/api/v1/fraud/check-prompt")
async def fraud_check_prompt(req: FraudCheckPromptRequest):
    result = state.fraud.check_prompt(req.prompt, req.existing_prompts)
    return {"success": True, "data": result}

@app.post("/api/v1/fraud/check-review")
async def fraud_check_review(req: FraudCheckReviewRequest):
    result = state.fraud.check_review(req.review, req.user_reviews)
    return {"success": True, "data": result}

@app.post("/api/v1/fraud/check-transactions")
async def fraud_check_transactions(req: AnomalyRequest):
    result = state.fraud.check_transaction_pattern(req.orders)
    return {"success": True, "data": result}

@app.post("/api/v1/fraud/check-image")
async def fraud_check_image(file: UploadFile = File(...)):
    contents = await file.read()
    result = state.image_fraud.analyze_image(contents)
    return {"success": True, "data": result}


# ---------------------------------------------------------------------------
# Recommendations Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/recommendations")
async def get_recommendations(req: RecommendRequest):
    user = None
    orders = None
    wishlist = None

    if req.user_id:
        try:
            user = state.db.get_user_by_id(req.user_id)
            orders = state.db.get_user_orders(req.user_id)
            wishlist = state.db.get_user_wishlist(req.user_id)
        except Exception as e:
            logger.warning(f"Failed to load user data: {e}")

    if not req.prompts:
        try:
            req.prompts = state.db.get_active_prompts(limit=500)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load prompts: {e}")

    recommendations = state.recommend.recommend_for_user(
        user, req.prompts, orders, wishlist, req.top_n
    )
    return {"success": True, "data": recommendations}

@app.post("/api/v1/recommendations/similar")
async def get_similar(req: SimilarPromptsRequest):
    if not req.prompts:
        try:
            req.prompts = state.db.get_active_prompts(limit=500)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    similar = state.recommend.similar_prompts(req.prompt, req.prompts, req.top_n)
    return {"success": True, "data": similar}

@app.get("/api/v1/recommendations/trending")
async def get_trending(top_n: int = Query(default=20, ge=1, le=50)):
    try:
        prompts = state.db.get_active_prompts(limit=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    trending = state.recommend._trending_recommendations(prompts, top_n)
    return {"success": True, "data": trending}

@app.get("/api/v1/recommendations/trending-searches")
async def get_trending_searches(top_n: int = Query(default=10, ge=1, le=50)):
    try:
        search_log = state.db.get_search_log(limit=1000)
    except Exception as e:
        logger.warning(f"Failed to load search log: {e}")
        search_log = []

    searches = state.recommend.trending_searches(search_log, top_n)
    return {"success": True, "data": searches}


# ---------------------------------------------------------------------------
# Payment Risk Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/payments/risk-score")
async def payment_risk_score(req: ScoreTransactionRequest):
    result = state.payment_risk.score_transaction(
        req.order, req.buyer, req.recent_orders, req.prompt
    )
    return {"success": True, "data": result}

@app.post("/api/v1/payments/payout-risk")
async def payout_risk_score(req: ScorePayoutRequest):
    result = state.payment_risk.score_payout(
        req.payout, req.seller, req.recent_payouts
    )
    return {"success": True, "data": result}


# ---------------------------------------------------------------------------
# Quality Scoring Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/quality/score")
async def quality_score(req: QualityScoreRequest):
    result = state.quality.score_prompt(req.prompt, req.category_avg_price)
    return {"success": True, "data": result}

@app.post("/api/v1/quality/batch")
async def quality_batch(req: BatchQualityRequest):
    results = state.quality.score_batch(req.prompts)
    return {"success": True, "data": results}


# ---------------------------------------------------------------------------
# Feature Extraction Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/features/user")
async def extract_user_features(user: Dict[str, Any] = Body(...)):
    features = state.features.user_features(user)
    return {"success": True, "data": features}

@app.post("/api/v1/features/prompt")
async def extract_prompt_features(prompt: Dict[str, Any] = Body(...)):
    features = state.features.prompt_features(prompt)
    return {"success": True, "data": features}


# ---------------------------------------------------------------------------
# Batch / Maintenance Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/train")
async def train_models():
    """Retrain/fit models on latest data."""
    try:
        prompts = state.db.get_active_prompts(limit=5000)
        state.search.build_idf(prompts)
        logger.info(f"Retrained search engine on {len(prompts)} prompts")

        # Score and update quality for all prompts
        scores = state.quality.score_batch(prompts)
        for i, p in enumerate(prompts[:1000]):
            try:
                state.db.update_prompt_quality_score(
                    p['id'], scores[i]['overall_score'], scores[i]['grade']
                )
            except Exception as e:
                logger.warning(f"Failed to update quality score: {e}")

        return {
            "success": True,
            "data": {
                "prompts_scored": len(scores[:1000]),
                "search_engine_retrained": True,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run("src.ai.main:app", host="0.0.0.0", port=port, reload=True)
