import hashlib
import logging
import math
import os
from typing import Any


logger = logging.getLogger("maghgo-ai.embeddings")
EMBEDDING_DIM = 384
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

_model: Any | None = None
_load_attempted = False
_load_error: str | None = None


def _load_model() -> Any | None:
    global _model, _load_attempted, _load_error

    if _load_attempted:
        return _model

    _load_attempted = True
    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model %s", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)
        _load_error = None
    except Exception as exc:
        _model = None
        _load_error = str(exc)
        logger.warning("Using hashing embedding fallback: %s", exc)

    return _model


def _hashing_embedding(text: str) -> list[float]:
    vector = [0.0] * EMBEDDING_DIM
    tokens = text.lower().split() or [text.lower()]

    for token in tokens:
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
        index = int.from_bytes(digest[:4], "big") % EMBEDDING_DIM
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        weight = 1.0 + digest[5] / 255.0
        vector[index] += sign * weight

    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [round(value / norm, 6) for value in vector]


def get_embedding(text: str) -> list[float]:
    """Generate a 384-dimensional embedding for prompt search and recommendations."""
    clean_text = (text or "").strip()
    if not clean_text:
        return [0.0] * EMBEDDING_DIM

    model = _load_model()
    if model is None:
        return _hashing_embedding(clean_text)

    embedding = model.encode(clean_text)
    return [float(value) for value in embedding.tolist()]


def get_embedding_status() -> dict[str, Any]:
    if _model is not None:
        backend = "sentence-transformers"
    elif _load_attempted:
        backend = "hashing-fallback"
    else:
        backend = "lazy"

    return {
        "backend": backend,
        "model": MODEL_NAME,
        "dimension": EMBEDDING_DIM,
        "fallbackAvailable": True,
        "lastError": _load_error,
    }
