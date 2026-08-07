"""Farmer profile, wallet, and transaction history."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection as PGConnection
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.deps import get_current_farmer_id
from app.schemas.schemas import ApiResponse

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=ApiResponse)
def get_profile(farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """SELECT id, phone, email, full_name, village, district, state, pin_code,
                      farm_size, main_crops, kyc_status, created_at FROM farmers WHERE id = %s""",
            (farmer_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return ApiResponse(success=True, data=row, message="")


@router.get("/wallet", response_model=ApiResponse)
def get_wallet(farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM wallet WHERE farmer_id = %s", (farmer_id,))
        wallet = cur.fetchone()
        cur.execute(
            """SELECT t.* FROM transactions t JOIN wallet w ON w.id = t.wallet_id
               WHERE w.farmer_id = %s ORDER BY t.created_at DESC LIMIT 50""",
            (farmer_id,),
        )
        history = cur.fetchall()
    return ApiResponse(success=True, data={"wallet": wallet, "history": history}, message="")
