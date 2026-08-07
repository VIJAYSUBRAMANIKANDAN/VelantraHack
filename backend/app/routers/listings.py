"""Listings CRUD + AI fair price endpoint."""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extensions import connection as PGConnection
from psycopg2.extras import RealDictCursor

from app.core.database import get_db
from app.core.deps import get_current_farmer_id
from app.schemas.schemas import ApiResponse, ListingCreate, FairPriceRequest, FairPriceResponse
from app.ml.price_model import predict_fair_price, known_crops, predict_city_demand

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post("", response_model=ApiResponse)
def create_listing(payload: ListingCreate, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    # NOTE: payload.quantity is the farmer's own listing size in kg (e.g.
    # 400), which is a totally different scale from "arrival" (national
    # market arrival in tonnes, e.g. thousands). Passing quantity as
    # arrival was previously sending wildly out-of-range values into the
    # model and causing nonsense predictions. Leave arrival as None so
    # predict_fair_price uses the crop's own real recent arrival figure.
    ai_price, *_ = predict_fair_price(payload.crop_name, None, payload.location, payload.harvest_date)
    expires_at = date.today() + timedelta(days=14)

    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO listings (farmer_id, crop_name, quantity, unit, location, expected_price,
                                   ai_suggested_price, harvest_date, crop_quality, status, views, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', 0, %s)
            RETURNING *
            """,
            (farmer_id, payload.crop_name, payload.quantity, payload.unit, payload.location,
             payload.expected_price, ai_price, payload.harvest_date, payload.crop_quality, expires_at),
        )
        listing = cur.fetchone()
    return ApiResponse(success=True, data=listing, message="Listing created")


@router.get("", response_model=ApiResponse)
def list_my_listings(farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM listings WHERE farmer_id = %s ORDER BY created_at DESC", (farmer_id,))
        rows = cur.fetchall()
    return ApiResponse(success=True, data=rows, message="")


@router.patch("/{listing_id}/status", response_model=ApiResponse)
def update_status(listing_id: int, status: str, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    if status not in ("active", "paused", "sold"):
        raise HTTPException(status_code=400, detail="Invalid status")
    with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "UPDATE listings SET status = %s WHERE id = %s AND farmer_id = %s RETURNING *",
            (status, listing_id, farmer_id),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ApiResponse(success=True, data=row, message="Status updated")


@router.delete("/{listing_id}", response_model=ApiResponse)
def delete_listing(listing_id: int, farmer_id: int = Depends(get_current_farmer_id), db: PGConnection = Depends(get_db)):
    with db.cursor() as cur:
        cur.execute("DELETE FROM listings WHERE id = %s AND farmer_id = %s", (listing_id, farmer_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Listing not found")
    return ApiResponse(success=True, data=None, message="Listing deleted")


@router.get("/market-insights", response_model=ApiResponse)
def market_insights(
    city: str | None = Query(
        None,
        description="Optional city/mandi name (e.g. 'Coimbatore'). When given, "
                    "every known crop is priced for that city in real time and "
                    "split into high-demand / low-demand lists.",
    )
):
    """Powers the Dashboard's 'AI Market Insights' card: today's price +
    trend for a small watchlist of crops, plus a sell-now/hold call for
    the farmer's own most recent active listing (if any).

    Intentionally NOT behind auth: the data below is a generic watchlist,
    not personalized to a specific farmer_id, and this card is also shown
    to guests (Welcome page's "Continue as guest" never gets a real JWT
    from the backend). Requiring auth here meant the card always silently
    fell back to demo data for guests even with the backend running fine.
    """
    # NOTE: crop names here should match the CSV's `Commodity` column (see
    # app/ml/price_model.py's _CROPS list), but predict_fair_price() now
    # also resolves common aliases like "Tomatoes"/"Onions" (see
    # _CROP_ALIASES) so near-misses no longer silently fall back to the
    # first known crop. "Turmeric" still isn't in this report at all, so
    # it's intentionally left out of the watchlist below.
    #
    # arrival is left as None (not the old hardcoded 500) so each crop
    # uses its own real recent arrival figure instead of one arbitrary
    # number applied to every commodity regardless of scale.
    watchlist = [
        ("Tomato", "Chennai"),
        ("Onion", "Nashik"),
        ("Potato", "Erode"),
        ("Cotton", "Salem"),
    ]
    prices = []
    for crop, region in watchlist:
        price, confidence, trend, recommendation = predict_fair_price(crop, None, region)
        prices.append({
            "crop": crop, "region": region, "price": price,
            "trend": trend, "recommendation": recommendation,
        })

    high_demand = [p["crop"] for p in prices if p["recommendation"] in ("sell_now", "watch")]

    # Real, per-city breakdown: price every known crop for the requested
    # city using the same live model + REGION_MULTIPLIERS as everything
    # else here (see price_model.py docstring for what "real" means for
    # region — genuine ML base price + a documented regional multiplier,
    # never a hardcoded/mock number). No city given -> omitted entirely
    # rather than sending a fake/empty placeholder.
    city_breakdown = None
    if city and city.strip():
        city_prices = [predict_city_demand(crop, city) for crop in known_crops()]
        city_breakdown = {
            "city": city.strip(),
            "high_demand_crops": [p["crop"] for p in city_prices if p["demand"] == "high"],
            "steady_demand_crops": [p["crop"] for p in city_prices if p["demand"] == "steady"],
            "low_demand_crops": [p["crop"] for p in city_prices if p["demand"] == "low"],
            "prices": sorted(city_prices, key=lambda p: p["demand_score"], reverse=True),
        }

    return ApiResponse(
        success=True,
        data={"prices": prices, "high_demand_crops": high_demand, "city_breakdown": city_breakdown},
        message="",
    )


@router.post("/fair-price", response_model=ApiResponse)
def fair_price(payload: FairPriceRequest):
    # Intentionally NOT behind auth (see market_insights above for the same
    # reasoning) — this is a stateless model prediction from crop/region/
    # date, not personalized farmer data, and guests never hold a real JWT.
    # Requiring one here was the actual cause of "log in to get a live AI
    # price": every logged-out request 401'd and the frontend silently
    # substituted a fake `price * 1.08` guess instead of the real model.
    #
    # Same fix as create_listing: payload.quantity is a listing size in kg,
    # not a national arrival figure — don't pass it as arrival.
    ai_price, confidence, trend, recommendation = predict_fair_price(
        payload.crop_name, None, payload.region, payload.harvest_date
    )
    response = FairPriceResponse(
        farmer_price=ai_price,  # farmer's own price is passed back by the frontend for comparison
        ai_suggested_price=ai_price,
        confidence=confidence,
        market_trend=trend,
        recommendation=recommendation,
    )
    return ApiResponse(success=True, data=response.model_dump(), message="")
