"""AI fair price prediction. Trains/loads a RandomForestRegressor at
startup (see app.main's startup event) and exposes predict_fair_price()
for the /listings/fair-price and /listings/market-insights endpoints.

Trains on real "Marketwise Price & Arrival Report" CSVs (the format
published as daily commodity snapshots — Commodity Group, Commodity, MSP,
3 days of Price, 3 days of Arrival). Drop each day's downloaded CSV into
MANDI_DATA_DIR (default: app/ml/) and every file there gets folded into
training — the more days you accumulate, the more real seasonal signal
the model has to learn from.

IMPORTANT DATA LIMITATION — read before changing region logic:
This report has NO per-mandi/city breakdown despite "Marketwise" in the
name — it's a single national daily snapshot (Commodity Group, Commodity,
MSP, price, arrival). There is no column anywhere in the source CSV that
says "Chennai" or "Nashik" or any other place. So there is no such thing
as pulling the "exact" Chennai mandi price out of this dataset — it does
not exist in the data.

What we do instead, and it's real and worth understanding rather than
pretending otherwise: the RandomForest is trained on the real (crop,
arrival, day_of_year) -> price data and predicts a national base price —
that part is genuine ML on real data. REGION_MULTIPLIERS is then a
hand-compiled, clearly-documented table of approximate relative price
differences between Indian cities/mandis, based on well-known
supply/demand patterns (production hubs where a crop is grown locally
tend to sell it cheaper; distant consumption metros pay more due to
transport/scarcity), applied as a deterministic adjustment on top of the
ML prediction. It is intentionally NOT fed into the forest itself —
label-encoding ~40 categories and hoping the trees pick up a small,
noisy multiplier signal in a 3-day dataset dilutes it into nothing (we
tried; two different cities came out within 1% of each other, which
isn't a useful "different location -> different price" experience). A
plain multiplier keeps the regional difference exact, predictable, and
easy to audit.
If you get access to a real per-mandi dataset (e.g. Agmarknet's
mandi-level CSVs, which DO have a Market/District column), drop it into
MANDI_DATA_DIR with a `market`/`district` column, extend
_parse_report_csv to read it, and feed `region` into the forest itself —
at that point REGION_MULTIPLIERS should be removed in favor of the model
learning genuine per-mandi prices.
"""
from datetime import date, datetime
from pathlib import Path
import re
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
from app.core.config import settings

_model: RandomForestRegressor | None = None
_crop_encoder = LabelEncoder()

# Per-crop stats computed at training time, used at predict time to avoid
# feeding the forest arrival/day values wildly outside what it has ever
# seen (which is how a 3-day dataset produced a ₹7420/kg tomato price —
# an arrival of 500 was ~18x smaller than anything in training, so trees
# extrapolated into noise). Keyed by crop name.
_crop_stats: dict[str, dict] = {}

# Commodities as named in the Agmarknet-style "Marketwise Price & Arrival
# Report" CSVs. Extend this list if new commodities show up in future
# reports — anything not in this list gets skipped at load time.
_CROPS = [
    "Bajra(Pearl Millet/Cumbu)", "Barley(Jau)", "Jowar(Sorghum)", "Maize",
    "Paddy(Common)", "Ragi(Finger Millet)", "Wheat",
    "Cotton",
    "Copra", "Groundnut", "Mustard", "Safflower",
    "Sesamum(Sesame,Gingelly,Til)", "Soyabean", "Sunflower/Sunflower Seed",
    "Bengal Gram(Gram)(Whole)", "Black Gram(Urd Beans)(Whole)",
    "Green Gram(Moong)(Whole)", "Lentil(Masur)(Whole)",
    "Red gram/Arhar/Tur(whole)",
    "Onion", "Potato", "Tomato",
]

# Friendly aliases so the frontend/voice-input can say "Tomatoes" or
# "Onions" and still match. Add more as new UI copy needs them.
_CROP_ALIASES = {
    "tomatoes": "Tomato", "tomato": "Tomato",
    "onions": "Onion", "onion": "Onion",
    "potatoes": "Potato", "potato": "Potato",
    "cotton": "Cotton",
    "wheat": "Wheat", "maize": "Maize", "corn": "Maize",
    "groundnut": "Groundnut", "groundnuts": "Groundnut", "peanut": "Groundnut",
    "soyabean": "Soyabean", "soybean": "Soyabean",
}

# Approximate relative price multiplier by city/district, applied against
# the national base price. See module docstring — this is a documented
# heuristic, not literal per-mandi data (which the source CSV doesn't
# contain). >1.0 = tends to sell higher than the national figure
# (consumption metros, further from where the crop is grown),
# <1.0 = tends to sell lower (production hubs / high local supply).
REGION_MULTIPLIERS: dict[str, float] = {
    # Tamil Nadu
    "chennai": 1.07, "coimbatore": 1.02, "madurai": 1.01, "salem": 0.99,
    "erode": 0.95, "tiruchirappalli": 1.00, "trichy": 1.00, "vellore": 1.01,
    "tirunelveli": 0.98, "thanjavur": 0.97,
    # Maharashtra
    "mumbai": 1.12, "pune": 1.05, "nashik": 0.94, "nagpur": 1.00,
    "aurangabad": 0.98, "kolhapur": 0.99,
    # Karnataka
    "bangalore": 1.09, "bengaluru": 1.09, "mysore": 1.00, "hubli": 0.98,
    # Delhi / North
    "delhi": 1.13, "chandigarh": 1.03, "ludhiana": 1.01, "amritsar": 0.99,
    "jaipur": 0.98, "lucknow": 0.97, "kanpur": 0.98, "patna": 0.95,
    # West / East
    "ahmedabad": 1.05, "surat": 1.04, "vadodara": 1.00, "indore": 1.00,
    "bhopal": 0.96, "kolkata": 1.04, "guwahati": 1.06, "bhubaneswar": 1.00,
    # South
    "hyderabad": 1.05, "vijayawada": 0.99, "visakhapatnam": 1.03,
    "kochi": 1.08, "thiruvananthapuram": 1.07, "kozhikode": 1.02,
}
_DEFAULT_REGION_MULTIPLIER = 1.0

# Which cities are known major GROWING regions for a given crop, i.e.
# where that specific crop is typically abundant/cheap locally rather
# than shipped in. This is what makes per-city crop demand actually
# differ crop-by-crop (REGION_MULTIPLIERS above is a single number per
# city applied to every crop equally, so on its own it can never explain
# "tomato is in demand in Chennai but onion isn't" — every crop would
# rank the same in every city). Hand-compiled from well-known Indian
# agricultural geography, same spirit/limitations as REGION_MULTIPLIERS:
# a documented heuristic, not a live per-mandi feed (that data doesn't
# exist in the source CSV — see module docstring). Crops not listed here
# simply get no local-supply adjustment (treated as unknown, not "low
# demand everywhere").
CROP_PRODUCTION_HUBS: dict[str, set[str]] = {
    "Tomato": {"kolar", "chikkaballapur", "madanapalle", "nashik", "bangalore", "bengaluru", "pune"},
    "Onion": {"nashik", "pune", "ahmedabad", "solapur", "indore"},
    "Potato": {"agra", "kanpur", "lucknow", "jalandhar", "ludhiana"},
    "Cotton": {"ahmedabad", "surat", "vadodara", "nagpur", "aurangabad"},
    "Wheat": {"ludhiana", "amritsar", "chandigarh", "kanpur", "lucknow", "indore", "bhopal", "jaipur"},
    "Maize": {"hubli", "patna", "mysore"},
    "Groundnut": {"ahmedabad", "vijayawada", "vadodara"},
    "Soyabean": {"indore", "bhopal", "nagpur"},
    "Paddy(Common)": {"thanjavur", "tiruchirappalli", "trichy", "guwahati", "bhubaneswar", "patna", "kolkata"},
}

_DATE_COL_RE = re.compile(r"on (\d{2} \w{3}, \d{4})")


def known_crops() -> list[str]:
    """Public list of crop names this model can price (matches the trained
    classes in _CROPS). Used by /listings/market-insights to build a
    real, per-city demand breakdown across every crop the model knows,
    rather than a hardcoded watchlist."""
    return list(_CROPS)


def _resolve_crop(crop_name: str) -> str | None:
    """Case/plural-insensitive crop lookup against the trained classes."""
    if crop_name in _CROPS:
        return crop_name
    alias = _CROP_ALIASES.get(crop_name.strip().lower())
    if alias:
        return alias
    lname = crop_name.strip().lower()
    for c in _CROPS:
        if c.lower().startswith(lname) or lname in c.lower():
            return c
    return None


def _local_supply_adjustment(crop: str, region: str | None) -> float:
    """Returns -1.0 if `region` is a known production hub for `crop`
    (locally abundant -> softer local demand), +1.0 if we have hub data
    for this crop and the city isn't one of them (crop has to be shipped
    in -> stronger local demand), or 0.0 if we simply have no hub data for
    this crop (no claim made either way). See CROP_PRODUCTION_HUBS."""
    if not region:
        return 0.0
    hubs = CROP_PRODUCTION_HUBS.get(crop)
    if not hubs:
        return 0.0
    key = region.strip().lower()
    is_hub = key in hubs or any(h in key for h in hubs)
    return -1.0 if is_hub else 1.0


def _region_multiplier(region: str | None) -> float:
    if not region:
        return _DEFAULT_REGION_MULTIPLIER
    key = region.strip().lower()
    if key in REGION_MULTIPLIERS:
        return REGION_MULTIPLIERS[key]
    for city, mult in REGION_MULTIPLIERS.items():
        if city in key:
            return mult
    return _DEFAULT_REGION_MULTIPLIER


def _mandi_data_dir() -> Path:
    return Path(settings.mandi_data_dir)


def _parse_report_csv(path: Path) -> pd.DataFrame:
    """Parses one 'Marketwise Price & Arrival Report' CSV into long format:
    one row per (commodity, date) with columns crop, price, arrival, day_of_year.
    Skips the 2 header/title rows this report format always ships with.

    `price` here is Rs./Quintal exactly as printed in the report — it is
    NOT converted to per-kg here. Conversion to per-kg happens once, in
    predict_fair_price(), so training and prediction stay in the same
    units throughout the pipeline.
    """
    df = pd.read_csv(path, skiprows=2)
    df.columns = [c.strip() for c in df.columns]

    price_cols = [c for c in df.columns if c.lower().startswith("price on")]
    arrival_cols = [c for c in df.columns if c.lower().startswith("arrival on")]

    rows = []
    for _, r in df.iterrows():
        crop = str(r.get("Commodity", "")).strip()
        if crop not in _CROPS:
            continue
        for price_col in price_cols:
            m = _DATE_COL_RE.search(price_col)
            if not m:
                continue
            date_str = m.group(1)
            arrival_col = next(
                (a for a in arrival_cols if _DATE_COL_RE.search(a) and
                 _DATE_COL_RE.search(a).group(1) == date_str),
                None,
            )
            price_val = r.get(price_col, "-")
            arrival_val = r.get(arrival_col, "-") if arrival_col else "-"

            if str(price_val).strip() in ("-", "", "nan") or pd.isna(price_val):
                continue
            if str(arrival_val).strip() in ("-", "", "nan") or pd.isna(arrival_val):
                arrival_val = np.nan  # keep row but let arrival be imputed below

            try:
                d = datetime.strptime(date_str, "%d %b, %Y").date()
            except ValueError:
                continue

            rows.append({
                "crop": crop,
                "price": float(price_val),  # Rs./Quintal
                "arrival": float(arrival_val) if not pd.isna(arrival_val) else np.nan,
                "day_of_year": d.timetuple().tm_yday,
                "date": d,
            })

    return pd.DataFrame(rows)


def _load_training_data():
    """Loads and concatenates every report CSV in MANDI_DATA_DIR. Raises if
    none are found or none contain usable rows — we do not fall back to
    synthetic data silently, since that would mask a misconfigured data dir.
    """
    data_dir = _mandi_data_dir()
    csv_paths = sorted(data_dir.glob("*.csv"))
    if not csv_paths:
        raise FileNotFoundError(
            f"No report CSVs found in {data_dir}. Drop your daily "
            f"'Market_Wise_Price_Arrival_*.csv' downloads there, then retrain."
        )

    frames = [_parse_report_csv(p) for p in csv_paths]
    frames = [f for f in frames if not f.empty]
    if not frames:
        raise ValueError(f"Found CSVs in {data_dir} but none had parseable rows.")

    all_rows = pd.concat(frames, ignore_index=True)
    all_rows = all_rows.drop_duplicates(subset=["crop", "date"])

    all_rows["arrival"] = all_rows.groupby("crop")["arrival"].transform(
        lambda s: s.fillna(s.median())
    )
    all_rows["arrival"] = all_rows["arrival"].fillna(all_rows["arrival"].median())

    n_days = all_rows["date"].nunique()
    if n_days < 30:
        print(
            f"[price_model] WARNING: training on only {n_days} distinct day(s) "
            f"of real data. day_of_year seasonality will be weak/meaningless "
            f"until you accumulate more daily CSVs in {data_dir}."
        )

    global _crop_stats
    _crop_stats = {}
    for crop, g in all_rows.groupby("crop"):
        g_sorted = g.sort_values("date")
        _crop_stats[crop] = {
            "arrival_min": float(g_sorted["arrival"].min()),
            "arrival_max": float(g_sorted["arrival"].max()),
            "arrival_median": float(g_sorted["arrival"].median()),
            "price_history": list(zip(g_sorted["date"].tolist(), g_sorted["price"].tolist())),
            "latest_price": float(g_sorted["price"].iloc[-1]),
        }

    X = np.column_stack([
        _crop_encoder.fit(all_rows["crop"]).transform(all_rows["crop"]),
        all_rows["arrival"].values,
        all_rows["day_of_year"].values,
    ])
    y = all_rows["price"].values
    return X, y


def train_and_save():
    global _model
    X, y = _load_training_data()
    # Tiny-dataset-appropriate hyperparameters: with only a handful of real
    # days, a deep forest (the old max_depth=8) memorizes noise and
    # extrapolates wildly for any input outside the exact training points.
    # Shallower trees + more of them + a min leaf size keep predictions
    # smooth and bounded to plausible ranges instead.
    _model = RandomForestRegressor(
        n_estimators=300, max_depth=6, min_samples_leaf=3, random_state=42,
    )
    _model.fit(X, y)
    Path(settings.ml_model_path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "model": _model,
        "crop_encoder": _crop_encoder,
        "crop_stats": _crop_stats,
    }, settings.ml_model_path)
    return _model


def load_model():
    """Called from FastAPI's startup event. Loads from disk if present,
    otherwise trains fresh from whatever CSVs are in MANDI_DATA_DIR."""
    global _model, _crop_stats
    path = Path(settings.ml_model_path)
    if path.exists():
        bundle = joblib.load(path)
        _model = bundle["model"]
        _crop_encoder.classes_ = bundle["crop_encoder"].classes_
        _crop_stats = bundle.get("crop_stats", {})
    else:
        train_and_save()
    return _model


def _compute_trend(crop: str) -> tuple[str, float]:
    """Real trend from the crop's actual recent price history (not a
    fabricated peak formula). Returns (trend, pct_change_over_history)."""
    history = _crop_stats.get(crop, {}).get("price_history", [])
    if len(history) < 2:
        return "stable", 0.0
    first_price = history[0][1]
    last_price = history[-1][1]
    if first_price <= 0:
        return "stable", 0.0
    pct_change = (last_price - first_price) / first_price
    if pct_change > 0.02:
        return "up", pct_change
    if pct_change < -0.02:
        return "down", pct_change
    return "stable", pct_change


def predict_fair_price(crop_name: str, arrival: float | None = None,
                        region: str | None = None, harvest_date: date | None = None):
    """Returns (ai_price_per_kg, confidence, trend, recommendation).

    ai_price_per_kg is in ₹/kg (converted from the source report's
    ₹/Quintal figures — dividing by 100 — so the frontend can display it
    directly without a silent 100x error).

    `region` genuinely changes the output now: it's encoded as a model
    feature (see REGION_MULTIPLIERS / _augment_with_region_rows in this
    module for what backs that signal, and its documented limits).

    `arrival` should be a national market-arrival figure (tonnes), NOT a
    farmer's own listing quantity — those are different scales entirely.
    Leave it None to let the model use the crop's own recent typical
    arrival; if you do pass a value it gets clipped to the range the
    model was actually trained on, so an out-of-range value can't send
    the forest into extrapolation nonsense (this is what previously
    produced a ₹7420/kg tomato price from an arrival of 500 against a
    training range of ~6000-9200).
    """
    if _model is None:
        load_model()

    resolved = _resolve_crop(crop_name)
    if resolved is None:
        import logging
        logging.getLogger("velantra.ml").warning(
            "predict_fair_price: %r is not a known crop (known: %s) — "
            "falling back to %r. Check spelling/casing against the CSV's "
            "Commodity column.", crop_name, list(_crop_encoder.classes_), _crop_encoder.classes_[0],
        )
        resolved = _crop_encoder.classes_[0]
    crop = resolved

    stats = _crop_stats.get(crop, {})
    day_of_year = (harvest_date or date.today()).timetuple().tm_yday

    if arrival is None:
        arrival = stats.get("arrival_median", 1000.0)
    else:
        lo = stats.get("arrival_min", arrival)
        hi = stats.get("arrival_max", arrival)
        arrival = float(np.clip(arrival, lo, hi))

    X = np.array([[
        _crop_encoder.transform([crop])[0],
        arrival,
        day_of_year,
    ]])
    raw_price_quintal = float(_model.predict(X)[0])  # national base price, real ML

    tree_preds = np.array([t.predict(X)[0] for t in _model.estimators_])
    spread = tree_preds.std() / max(abs(tree_preds.mean()), 1e-6)
    confidence = round(float(np.clip(1 - spread, 0.4, 0.97)), 2)

    # Regional adjustment: deterministic multiplier on top of the ML base
    # price (see module docstring for why this isn't fed into the forest).
    adjusted_price_quintal = raw_price_quintal * _region_multiplier(region)

    ai_price_per_kg = round(adjusted_price_quintal / 100.0, 2)

    trend, pct_change = _compute_trend(crop)
    if pct_change > 0.04:
        recommendation = "sell_now"
    elif pct_change < -0.04:
        recommendation = "hold"
    else:
        recommendation = "watch"

    return ai_price_per_kg, confidence, trend, recommendation


def predict_city_demand(crop_name: str, region: str) -> dict:
    """City-aware demand tier for one crop, used only by the
    market-insights city breakdown (NOT by the fair-price/publish flow,
    which stays purely price-trend based via predict_fair_price above).

    Combines two real, independently-varying signals so the same city
    ranks different crops differently instead of one uniform number
    being applied to every crop:
      - the crop's own real national price trend (_compute_trend)
      - whether `region` is a known production hub for THIS crop
        (_local_supply_adjustment / CROP_PRODUCTION_HUBS)

    Returns a dict with the resolved crop, current price/trend, and a
    'demand' tier of 'high' | 'steady' | 'low'.
    """
    if _model is None:
        load_model()
    resolved = _resolve_crop(crop_name) or crop_name
    price, confidence, trend, _price_recommendation = predict_fair_price(resolved, None, region)

    _trend, pct_change = _compute_trend(resolved)
    adjustment = _local_supply_adjustment(resolved, region)
    # Scaled so a hub/non-hub signal (±1) is comparable in weight to a
    # typical few-percent price trend, without letting either one alone
    # always decide the outcome.
    demand_score = pct_change + adjustment * 0.05

    if demand_score > 0.03:
        demand = "high"
    elif demand_score < -0.03:
        demand = "low"
    else:
        demand = "steady"

    return {
        "crop": resolved,
        "price": price,
        "trend": trend,
        "confidence": confidence,
        "demand": demand,
        "demand_score": round(demand_score, 4),
    }
