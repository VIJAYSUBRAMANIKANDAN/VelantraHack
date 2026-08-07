# Velantra — Speak. Sell. Grow.

Full-stack farmer-to-buyer agricultural marketplace.

```
velantra/
  frontend/   React + Vite + Tailwind + Framer Motion — all 21 screens
  backend/    FastAPI + PostgreSQL + Whisper + scikit-learn + web3.py
    blockchain/  Solidity escrow contract + Hardhat (Polygon Mumbai)
```

## Quick start

**Database**
```bash
createdb velantra
psql -d velantra -f backend/db/schema.sql
```

**Backend**
```bash
cd backend
cp .env.example .env    # fill in DATABASE_URL, OPENAI_API_KEY
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:8000
npm install
npm run dev             # http://localhost:5173
```

## Fix: voice recording never finished
Tapping the mic only *starts* recording — the app was showing "Listening…"
forever because nothing told you to tap it a second time to stop. Fixed:
- The mic prompt now says "Tap the mic again to stop" while recording
- A live `0:05` timer shows it's actually capturing audio
- A 15-second auto-stop safety net kicks in if you forget to tap again
- If literally zero audio was captured, you get a clear error instead of
  a silent hang

## What changed in this round
- **Voice**: the mic now does real browser audio capture (`MediaRecorder`)
  and posts to `/voice/transcribe` (real Whisper call). If the backend is
  unreachable it falls back to a demo transcript so the rest of the flow
  stays testable — the "Live"/"Demo data" distinction is visible in the
  UI wherever it applies.
- **Language**: added `frontend/src/lib/i18n.js` — a real translation
  dictionary for Tamil/Hindi/Telugu/Marathi/English, applied to Welcome,
  Dashboard, Sidebar, Bottom nav, and the Voice Listing screen. Not every
  screen is translated yet (see "Still English-only" below) — the pattern
  (`useT()` + add keys to the dict) is there to extend it.
- **AI Market Insights**: added `GET /listings/market-insights` on the
  backend (uses the same RandomForest price model), and the Dashboard now
  fetches it on load instead of showing hardcoded numbers. Falls back to
  static demo values if the backend isn't running.

## Fix: language pills on the Voice Listing screen were decorative
They displayed Tamil/Hindi/Telugu/Marathi/English labels but weren't
buttons — tapping them did nothing, so `recognition.lang` always used
whatever language was last set on the Welcome/Dashboard screen (or
defaulted to English). Fixed:
- The pills are now real buttons, wired to `setLanguage()`
- The selected language is highlighted (filled green)
- They're disabled while actively listening (can't switch mid-recording)
- Added an inline note when a non-English language is selected, since
  Indian-language accuracy depends entirely on the browser/OS's speech
  engine, not on this app's code — Chrome on Android tends to be the
  strongest for Tamil/Hindi/Telugu/Marathi; desktop support varies more.

## Voice now uses the FREE browser SpeechRecognition API (not Whisper)
Switched `VoiceListing.jsx` from the paid Whisper/backend path to the
browser's built-in `SpeechRecognition` (Web Speech API):
- **Zero cost, zero API key, zero backend dependency** for transcription
- Auto-stops when you pause speaking (no more "tap again to stop" step)
- Shows live partial text while you talk, then the final transcript
- Respects the language picker (`en-IN`/`ta-IN`/`hi-IN`/`te-IN`/`mr-IN`)

**Browser support**: Chrome, Edge, and Safari support this. Firefox does
not — the screen will show a "browser doesn't support voice recognition"
message and offer the "Type it instead" fallback.

**Accuracy note**: this is Google's/Apple's speech engine (whichever the
browser ships), not Whisper. It's noticeably better for English than for
Tamil/Telugu/Marathi. The old Whisper path is still in
`backend/app/routers/voice.py` and `voiceApi.transcribe()` if you want to
switch back for better multi-language accuracy later — it's just not
wired into the UI anymore since it costs money to run.

## Important: microphone requires a secure context
Browsers only allow `getUserMedia` (mic access) on `https://` or
`http://localhost`. Voice listing will fail silently (or throw a
permission error) if you deploy the frontend on plain `http://` from a
non-localhost address — put it behind HTTPS (e.g. via a reverse proxy or
your hosting provider's default TLS) before testing on a real device.

## Still English-only
Buyer Requests, Order Details, Escrow, Delivery, Payment Received, My
Listings, Order History, Settings, Help — these screens aren't wired into
`i18n.js` yet. Same pattern as Dashboard: import `useT`, replace literal
strings with `t('key')`, add the key + 5 translations to the dictionary.

## Training the ML price model with real data
Right now `backend/app/ml/price_model.py` trains itself on **synthetic**
data at first boot — it's structurally realistic (seasonal curve, per-crop
base price, regional noise) but not real market data, so its numbers are
plausible demo output, not something to price actual crops from. To train
on real data:
1. Get historical mandi price data — India's [Agmarknet](https://agmarknet.gov.in)
   publishes daily commodity prices by market/state, or use eNAM data if
   you have access.
2. Replace `_load_training_data()` in `price_model.py` to load your CSV/DB
   instead of generating synthetic rows — keep the same feature shape
   (crop, region, quantity, day_of_year) so nothing downstream changes.
3. Delete the cached model file (path in `ML_MODEL_PATH`, default
   `app/ml/price_model.joblib`) so the backend retrains on next boot.
4. Restart the backend — check `/listings/market-insights` in `/docs`
   to see the new numbers.

## Blockchain — still needs manual deploy (unchanged from before)
See `backend/blockchain/README.md`. Compile, get testnet MATIC, deploy to
Mumbai, then copy the printed address into `ESCROW_CONTRACT_ADDRESS` and
the compiled ABI into `backend/blockchain/abi/VelantraEscrow.json`.

## Honest status
- Frontend: all 21 screens, now genuinely talking to the backend for
  auth/listings/voice/market-insights, with mock-data fallback if the
  backend's down.
- Backend: routers complete; still not run against a live Postgres in
  this environment — do a first-boot smoke test before trusting it.
- Blockchain: contract compiles conceptually, unaudited, not deployed
  here (no network access in this sandbox).
