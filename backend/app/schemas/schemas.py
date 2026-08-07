"""Pydantic request/response models. All API responses are wrapped in
ApiResponse so the frontend always gets { success, data, message }."""
from typing import Any, Optional, Literal
from pydantic import BaseModel, Field
from datetime import date, datetime


class ApiResponse(BaseModel):
    success: bool
    data: Any = None
    message: str = ""


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str
    village: str
    district: str
    state: str
    pin_code: str
    farm_size: Optional[float] = None
    main_crops: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc: Optional[str] = None
    upi_id: Optional[str] = None
    aadhaar_id: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: Optional[str] = None
    otp: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ---------- Voice ----------
class VoiceExtractResponse(BaseModel):
    transcript: str
    detected_language: str
    crop_name: Optional[str]
    quantity: Optional[float]
    unit: Optional[str]
    location: Optional[str]
    expected_price: Optional[float]
    confidence: float


# ---------- Listings ----------
class ListingCreate(BaseModel):
    crop_name: str
    quantity: float
    unit: str = "kg"
    location: str
    expected_price: float
    crop_quality: Optional[str] = None
    harvest_date: Optional[date] = None


class FairPriceRequest(BaseModel):
    crop_name: str
    quantity: float
    region: str
    harvest_date: Optional[date] = None


class FairPriceResponse(BaseModel):
    farmer_price: float
    ai_suggested_price: float
    confidence: float
    market_trend: Literal["up", "down", "stable"]
    recommendation: Literal["sell_now", "hold", "watch"]


# ---------- Orders / Escrow ----------
class BuyerRequestCreate(BaseModel):
    listing_id: int
    buyer_id: int
    offered_price: float
    quantity_requested: float
    delivery_location: str


class EscrowCreate(BaseModel):
    order_id: int
    total_amount: float
