"""Buyer requests and order lifecycle management."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection as PGConnection
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.deps import get_current_farmer_id
from app.schemas.schemas import ApiResponse, BuyerRequestCreate

router = APIRouter(tags=["orders"])


@router.post("/buyer-requests", response_model=ApiResponse)
def create_buyer_request(payload: BuyerRequestCreate, db: PGConnection = Depends(get_db)):
    """Called by the buyer-side client (not covered in this drop) when a
    buyer makes an offer on a farmer's listing."""
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """INSERT INTO buyer_requests (listing_id, buyer_id, offered_price, quantity_requested,
                                            delivery_location, status)
               VALUES (%s, %s, %s, %s, %s, 'pending') RETURNING *""",
            (payload.listing_id, payload.buyer_id, payload.offered_price,
             payload.quantity_requested, payload.delivery_location),
        )
        row = cur.fetchone()
    return ApiResponse(success=True, data=row, message="Request submitted")


@router.get("/buyer-requests", response_model=ApiResponse)
def list_buyer_requests(farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT br.* FROM buyer_requests br
               JOIN listings l ON l.id = br.listing_id
               WHERE l.farmer_id = %s ORDER BY br.created_at DESC""",
            (farmer_id,),
        )
        rows = cur.fetchall()
    return ApiResponse(success=True, data=rows, message="")


@router.patch("/buyer-requests/{request_id}", response_model=ApiResponse)
def respond_to_request(request_id: int, action: str, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    if action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'reject'")

    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """UPDATE buyer_requests SET status = %s WHERE id = %s
               AND listing_id IN (SELECT id FROM listings WHERE farmer_id = %s) RETURNING *""",
            ("accepted" if action == "accept" else "rejected", request_id, farmer_id),
        )
        req = cur.fetchone()
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        order = None
        if action == "accept":
            cur.execute(
                """INSERT INTO orders (buyer_request_id, farmer_id, buyer_id, crop_name, quantity,
                                        agreed_price, delivery_address, delivery_date, order_status)
                   SELECT %s, %s, br.buyer_id, l.crop_name, br.quantity_requested, br.offered_price,
                          br.delivery_location, NULL, 'pending'
                   FROM buyer_requests br JOIN listings l ON l.id = br.listing_id
                   WHERE br.id = %s RETURNING *""",
                (request_id, farmer_id, request_id),
            )
            order = cur.fetchone()

    return ApiResponse(success=True, data={"request": req, "order": order}, message=f"Request {action}ed")


@router.get("/orders", response_model=ApiResponse)
def list_orders(status: str | None = None, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    query = "SELECT * FROM orders WHERE farmer_id = %s"
    params = [farmer_id]
    if status:
        query += " AND order_status = %s"
        params.append(status)
    query += " ORDER BY created_at DESC"
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
    return ApiResponse(success=True, data=rows, message="")


@router.get("/orders/{order_id}", response_model=ApiResponse)
def get_order(order_id: int, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM orders WHERE id = %s AND farmer_id = %s", (order_id, farmer_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return ApiResponse(success=True, data=row, message="")


@router.post("/orders/{order_id}/deliver", response_model=ApiResponse)
def mark_delivered(order_id: int, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "UPDATE orders SET order_status = 'delivered' WHERE id = %s AND farmer_id = %s RETURNING *",
            (order_id, farmer_id),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return ApiResponse(success=True, data=row, message="Marked as delivered")
