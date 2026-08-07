"""Auth: register, login (password or OTP), token refresh.
OTP delivery (SMS gateway) is stubbed with a TODO — plug in MSG91/Twilio etc."""
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection as PGConnection

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, ApiResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse)
def register(payload: RegisterRequest, db: PGConnection = Depends(get_db)):
    with db.cursor() as cur:
        cur.execute("SELECT id FROM farmers WHERE phone = %s", (payload.phone,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Phone number already registered")

        cur.execute(
            """
            INSERT INTO farmers (phone, email, password_hash, full_name, village, district,
                                  state, pin_code, farm_size, main_crops, bank_account, ifsc,
                                  upi_id, aadhaar_id, kyc_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
            """,
            (
                payload.phone, payload.email, hash_password(payload.password), payload.full_name,
                payload.village, payload.district, payload.state, payload.pin_code,
                payload.farm_size, payload.main_crops, payload.bank_account, payload.ifsc,
                payload.upi_id, payload.aadhaar_id,
            ),
        )
        farmer_id = cur.fetchone()[0]

        # A wallet row is created alongside the farmer so /user/wallet never 404s.
        cur.execute(
            "INSERT INTO wallet (farmer_id, total_earnings, pending_amount, completed_amount) VALUES (%s, 0, 0, 0)",
            (farmer_id,),
        )

    tokens = TokenResponse(
        access_token=create_access_token(str(farmer_id)),
        refresh_token=create_refresh_token(str(farmer_id)),
    )
    return ApiResponse(success=True, data=tokens.model_dump(), message="Registered successfully")


@router.post("/login", response_model=ApiResponse)
def login(payload: LoginRequest, db: PGConnection = Depends(get_db)):
    with db.cursor() as cur:
        cur.execute("SELECT id, password_hash FROM farmers WHERE phone = %s", (payload.phone,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    farmer_id, password_hash = row

    if payload.otp:
        # TODO: verify payload.otp against the code issued by /auth/send-otp
        pass
    elif not payload.password or not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

    tokens = TokenResponse(
        access_token=create_access_token(str(farmer_id)),
        refresh_token=create_refresh_token(str(farmer_id)),
    )
    return ApiResponse(success=True, data=tokens.model_dump(), message="Logged in")


@router.post("/send-otp", response_model=ApiResponse)
def send_otp(phone: str):
    # TODO: integrate an SMS gateway (MSG91 / Twilio) and store the OTP
    # (hashed, short-lived) for verification in /auth/login.
    return ApiResponse(success=True, data=None, message=f"OTP sent to {phone}")
