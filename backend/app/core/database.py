"""
Synchronous Postgres connection pool (psycopg2), per the brief's
non-negotiable tech stack. FastAPI endpoints pull a connection per
request via the get_db dependency and it's returned to the pool after.

IMPORTANT: the pool is created lazily (on first use / at startup via
`init_pool()`), not at import time. Creating it at import time meant any
Postgres misconfiguration (wrong password, DB not running, wrong host)
crashed the whole process with a raw psycopg2 traceback before FastAPI's
own error handling ever ran — which is why connection issues looked like
mysterious total failures instead of a clear, actionable message.
"""
import logging
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool as pg_pool
from app.core.config import settings

logger = logging.getLogger("velantra.db")

_pool: pg_pool.ThreadedConnectionPool | None = None


def init_pool() -> None:
    """Called once from the FastAPI startup event. Fails loudly with a
    specific, human-readable reason instead of a bare psycopg2 traceback,
    so a wrong DATABASE_URL / stopped Postgres / bad password is obvious
    from the first line of the server log."""
    global _pool
    if _pool is not None:
        return
    try:
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 10, dsn=settings.database_url)
        # getconn/putconn round-trip proves the credentials actually work,
        # not just that the DSN string parses.
        conn = _pool.getconn()
        _pool.putconn(conn)
        logger.info("Connected to Postgres.")
    except psycopg2.OperationalError as exc:
        msg = str(exc).strip()
        hint = ""
        if "password authentication failed" in msg:
            hint = (
                " -> The DB user/password in DATABASE_URL don't match Postgres. "
                "Re-check backend/.env, or reset the role: "
                "psql -c \"ALTER USER velantra_user WITH PASSWORD 'yournewpassword';\" "
                "and update DATABASE_URL to match exactly."
            )
        elif "does not exist" in msg and "database" in msg:
            hint = " -> Run: createdb velantra  (then psql -d velantra -f backend/db/schema.sql)"
        elif "could not connect to server" in msg or "Connection refused" in msg:
            hint = " -> Postgres isn't running (or wrong host/port). Start it, e.g. `pg_ctl start` / `brew services start postgresql` / `sudo service postgresql start`."
        logger.error("Could not connect to Postgres: %s%s", msg, hint)
        raise RuntimeError(f"Database connection failed: {msg}{hint}") from exc


@contextmanager
def get_conn():
    if _pool is None:
        init_pool()
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def get_db():
    """FastAPI dependency: yields a live connection for the request."""
    with get_conn() as conn:
        yield conn
