"""In-app notifications. Polling-based for simplicity — swap GET for a
WebSocket endpoint if real-time push becomes a requirement."""
from fastapi import APIRouter, Depends
from psycopg2.extensions import connection as PGConnection
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.deps import get_current_farmer_id
from app.schemas.schemas import ApiResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=ApiResponse)
def list_notifications(farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    # Notifications aren't a first-class table in the brief's schema; this
    # derives a simple feed from recent buyer_requests/orders/escrow rows.
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT 'buyer_interested' AS type, br.created_at, l.crop_name AS detail
               FROM buyer_requests br JOIN listings l ON l.id = br.listing_id
               WHERE l.farmer_id = %s
               UNION ALL
               SELECT 'new_order', o.created_at, o.crop_name FROM orders o WHERE o.farmer_id = %s
               UNION ALL
               SELECT 'payment_released', e.released_at, e.order_id::text FROM escrow_records e
               JOIN orders o ON o.id = e.order_id WHERE o.farmer_id = %s AND e.released_at IS NOT NULL
               ORDER BY created_at DESC LIMIT 30""",
            (farmer_id, farmer_id, farmer_id),
        )
        rows = cur.fetchall()
    return ApiResponse(success=True, data=rows, message="")
