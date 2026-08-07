# Velantra Backend

FastAPI + PostgreSQL + Whisper + scikit-learn + web3.py, per the Velantra brief.

## Setup

### 1. Database
```bash
createdb velantra
psql velantra < db/schema.sql
```

### 2. Environment
```bash
cp .env.example .env
# fill in DATABASE_URL, OPENAI_API_KEY, and blockchain vars
```

### 3. Install & run
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 4. Blockchain (optional at first)
See `blockchain/README.md`. The API works without a deployed contract —
`/payments/create-escrow` records a placeholder transaction id until
`ESCROW_CONTRACT_ADDRESS` is set.

## Router map
| Router | Prefix | Covers |
|---|---|---|
| auth | /auth | register, login, OTP |
| voice | /voice | Whisper transcription + entity extraction |
| listings | /listings | CRUD, fair-price |
| orders | / | buyer requests, orders, delivery |
| payments | /payments | escrow create/release |
| user | /user | profile, wallet |
| notifications | /notifications | activity feed |

## Known gaps (flagged, not hidden)
- OTP send/verify is stubbed — needs an SMS gateway integration.
- Notifications are derived from existing tables at read time, not a
  dedicated table with read/unread state — fine for a first pass, revisit
  if push notifications are needed.
- The ML model trains on synthetic data at first boot if no saved model is
  found — replace `_load_training_data()` in `app/ml/price_model.py` with
  real historical mandi prices before relying on its output.
- No automated tests included yet.
