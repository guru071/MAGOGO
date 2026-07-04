import os
import json
import psycopg2
import psycopg2.extras
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from ..config import DATABASE_URL


PSYCOPG2_IGNORED_QUERY_PARAMS = {"pgbouncer", "connection_limit"}


def normalize_postgres_dsn(dsn: str) -> str:
    """Remove Prisma/Supabase URL hints that psycopg2/libpq cannot parse."""
    if not dsn:
        return dsn

    parsed = urlsplit(dsn)
    if parsed.scheme not in {"postgres", "postgresql"}:
        return dsn

    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in PSYCOPG2_IGNORED_QUERY_PARAMS
    ]
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


class Database:
    """Data access layer for the ML service.
    Reads from the shared Supabase Postgres database.
    """

    def __init__(self):
        self._conn_str = normalize_postgres_dsn(DATABASE_URL)

    @contextmanager
    def _cursor(self):
        conn = psycopg2.connect(self._conn_str)
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def get_active_prompts(self, limit: int = 1000) -> List[Dict]:
        with self._cursor() as cur:
            cur.execute("""
                SELECT
                    p.*,
                    p.embedding::text as embedding_str,
                    row_to_json(s) as seller,
                    row_to_json(c) as category,
                    COALESCE(
                        (SELECT json_agg(row_to_json(r))
                         FROM (SELECT * FROM "Review" WHERE "promptId" = p.id ORDER BY "createdAt" DESC) r),
                        '[]'::json
                    ) as reviews
                FROM "Prompt" p
                LEFT JOIN LATERAL (
                    SELECT id, name, avatar, "isVerified", "isSeller", "totalEarnings", bio
                    FROM "User" WHERE id = p."sellerId"
                ) s ON true
                LEFT JOIN LATERAL (
                    SELECT id, name, slug, icon
                    FROM "Category" WHERE id = p."categoryId"
                ) c ON true
                WHERE p.status = 'APPROVED'
                ORDER BY p."createdAt" DESC
                LIMIT %s
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]

    def get_all_users(self, limit: int = 1000) -> List[Dict]:
        with self._cursor() as cur:
            cur.execute("""
                SELECT * FROM "User"
                ORDER BY "createdAt" DESC
                LIMIT %s
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        with self._cursor() as cur:
            cur.execute('SELECT * FROM "User" WHERE id = %s', (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_orders(self, user_id: str, limit: int = 100) -> List[Dict]:
        with self._cursor() as cur:
            cur.execute("""
                SELECT * FROM "Order"
                WHERE "buyerId" = %s
                ORDER BY "createdAt" DESC
                LIMIT %s
            """, (user_id, limit))
            return [dict(r) for r in cur.fetchall()]

    def get_user_wishlist(self, user_id: str) -> List[str]:
        with self._cursor() as cur:
            cur.execute('SELECT "promptId" FROM "Wishlist" WHERE "userId" = %s', (user_id,))
            return [r['promptId'] for r in cur.fetchall()]

    def get_all_categories(self) -> List[Dict]:
        with self._cursor() as cur:
            cur.execute('SELECT * FROM "Category" WHERE "isActive" = true ORDER BY "sortOrder"')
            return [dict(r) for r in cur.fetchall()]

    def get_prompts_by_category(self, category_id: str, limit: int = 50) -> List[Dict]:
        with self._cursor() as cur:
            cur.execute("""
                SELECT p.*, p.embedding::text as embedding_str, row_to_json(s) as seller
                FROM "Prompt" p
                LEFT JOIN LATERAL (
                    SELECT id, name, avatar, "isVerified", "isSeller"
                    FROM "User" WHERE id = p."sellerId"
                ) s ON true
                WHERE p."categoryId" = %s AND p.status = 'APPROVED'
                ORDER BY p."createdAt" DESC
                LIMIT %s
            """, (category_id, limit))
            return [dict(r) for r in cur.fetchall()]

    def update_prompt_quality_score(self, prompt_id: str, score: float, grade: str) -> None:
        with self._cursor() as cur:
            cur.execute(
                'UPDATE "Prompt" SET "qualityScore" = %s, "qualityGrade" = %s WHERE id = %s',
                (score, grade, prompt_id)
            )

    def update_user_fraud_score(self, user_id: str, score: float, level: str) -> None:
        with self._cursor() as cur:
            cur.execute(
                'UPDATE "User" SET "fraudScore" = %s, "fraudLevel" = %s WHERE id = %s',
                (score, level, user_id)
            )

    def get_search_log(self, limit: int = 1000) -> List[str]:
        with self._cursor() as cur:
            cur.execute("""
                SELECT query FROM "SearchLog"
                ORDER BY "createdAt" DESC
                LIMIT %s
            """, (limit,))
            return [r['query'] for r in cur.fetchall()]

    def log_search(self, query: str, user_id: Optional[str], results_count: int) -> None:
        with self._cursor() as cur:
            cur.execute("""
                INSERT INTO "SearchLog" (query, "userId", "resultsCount", "createdAt")
                VALUES (%s, %s, %s, NOW())
            """, (query, user_id, results_count))
