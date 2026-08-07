"""Velantra FastAPI application: single app, modular routers, ML model
loaded once at startup as required by the brief."""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_pool
from app.ml.price_model import load_model
from app.routers import auth, voice, listings, orders, payments, user, notifications

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("velantra")

app = FastAPI(title="Velantra API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    logger.info("Connecting to Postgres...")
    init_pool()  # raises RuntimeError with a specific, actionable message on failure
    logger.info("Loading ML price model...")
    load_model()
    logger.info("Velantra API ready.")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"success": False, "data": None, "message": str(exc)})


@app.get("/health")
def health():
    from app.core.database import get_conn
    db_status = "ok"
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
    except Exception as exc:
        db_status = f"error: {exc}"
    return {"success": True, "data": {"status": "ok", "database": db_status}, "message": ""}


app.include_router(auth.router)
app.include_router(voice.router)
app.include_router(listings.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(user.router)
app.include_router(notifications.router)
