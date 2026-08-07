"""Voice listing creation. POST /voice/transcribe takes an uploaded audio
file, sends it to OpenAI Whisper, then runs lightweight entity extraction
(regex + keyword matching, per the brief) over the transcript."""
import re
import tempfile
from fastapi import APIRouter, UploadFile, File, Depends
from openai import OpenAI

from app.core.config import settings
from app.core.deps import get_current_farmer_id
from app.schemas.schemas import ApiResponse, VoiceExtractResponse

router = APIRouter(prefix="/voice", tags=["voice"])

_client = OpenAI(api_key=settings.openai_api_key)

UNIT_WORDS = ["kg", "kgs", "quintal", "ton", "tonnes"]


def extract_entities(text: str) -> dict:
    """Very lightweight NLP: regex + keyword matching. Good enough for the
    common "<qty> <unit> <crop> in <location>. Expected ₹<price> per <unit>"
    pattern; swap for a proper NLP/LLM extraction step as volume grows."""
    text_l = text.lower()

    qty_match = re.search(r"(\d+(?:\.\d+)?)\s*(kg|kgs|quintal|ton|tonnes)", text_l)
    price_match = re.search(r"(?:₹|rs\.?|rupees)?\s*(\d+(?:\.\d+)?)\s*(?:per|/)\s*(kg|quintal|ton)", text_l)
    location_match = re.search(r"\bin\s+([a-zA-Z]+)", text)
    crop_match = None
    if qty_match:
        after_qty = text[qty_match.end():]
        crop_match = re.search(r"\s*([a-zA-Z]+)", after_qty)

    confidence = sum(bool(m) for m in [qty_match, price_match, location_match, crop_match]) / 4

    return {
        "crop_name": crop_match.group(1).title() if crop_match else None,
        "quantity": float(qty_match.group(1)) if qty_match else None,
        "unit": qty_match.group(2) if qty_match else None,
        "location": location_match.group(1).title() if location_match else None,
        "expected_price": float(price_match.group(1)) if price_match else None,
        "confidence": round(confidence, 2),
    }


@router.post("/transcribe", response_model=ApiResponse)
async def transcribe(
    audio: UploadFile = File(...),
    farmer_id: int = Depends(get_current_farmer_id),
):
    # Persist the upload to a temp file — the OpenAI SDK expects a file object.
    suffix = "." + (audio.filename.split(".")[-1] if "." in audio.filename else "wav")
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(await audio.read())
        tmp.flush()
        with open(tmp.name, "rb") as f:
            result = _client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                # Supports auto-detection across Tamil, Hindi, Telugu, Marathi, English.
            )

    transcript = result.text
    entities = extract_entities(transcript)

    response = VoiceExtractResponse(
        transcript=transcript,
        detected_language=getattr(result, "language", "unknown"),
        **entities,
    )
    return ApiResponse(success=True, data=response.model_dump(), message="Transcribed")
