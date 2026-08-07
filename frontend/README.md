# Velantra — Frontend (Farmer flow, screens 1–9)

Speak. Sell. Grow. — voice-first agri marketplace for farmers.

## What's in this drop
Real Vite + React + Tailwind + Framer Motion + Zustand app covering the core
farmer flow end to end, wired together with client-side state (no backend yet):

1. Welcome (language select, login/register/guest)
2. Farmer Registration (4-step: Personal → Farm → Bank → Identity)
3. Login (password or OTP toggle)
4. Farmer Dashboard (stats, quick actions, AI insight card)
5. Voice Listing (mic button with signature growth-ring animation, mock transcript)
6. AI Listing Confirmation (editable form)
7. AI Fair Price (farmer vs AI price, trend bar, sell/hold recommendation)
8. Listing Published (share, create another)
9. My Listings (card list with edit/pause/delete)

Screens 10–21 (buyer requests, order details, escrow, delivery, payments,
order history, notifications detail, settings, help) are intentionally not
in this drop — see "Next steps" below. Stub pages exist for Orders, Wallet,
Notifications and Profile so navigation doesn't 404.

## Run it
```bash
npm install
npm run dev
```
Requires Node 18+. Opens on http://localhost:5173.

## Structure
```
src/
  components/   Button, Card, Input, Logo, MicButton, BottomNav, PageShell
  pages/        one file per screen
  store/        useStore.js — zustand global state (auth, listings, draft)
  assets/       logo.png (from the uploaded brand mark)
```

## Design tokens (tailwind.config.js)
- forest #1B5E3A / growth #2E8B4F / sun #F5A623 / cream #FBF9F4
- Display face: Sora · Body face: Inter
- Signature element: the mic button's concentric "growth rings" on the
  Voice Listing screen — echoes the logo's leaf/sun mark instead of a
  generic waveform.

## Wiring to a real backend
Every place data is mocked is marked `// TODO` and shaped to match the
FastAPI contract described in the original brief:
- `src/store/useStore.js` — `login()`, `confirmDraftListing()` → replace with
  calls to `/auth/*` and `/listings` (POST)
- `src/pages/VoiceListing.jsx` — `extractEntities()` and the mock timers →
  replace with `POST /voice/transcribe` (Whisper) + NLP extraction response
- `src/pages/FairPrice.jsx` — the `aiPrice`/`peakPrice` math → replace with
  `POST /listings/fair-price` (RandomForestRegressor)

## Next steps (not built yet — real scope, not hand-waved)
- Screens 10–21: buyer requests, order details, escrow payment, delivery
  confirmation, payment received, order history tabs, settings, help
- FastAPI backend: routers, Postgres schema + migrations, JWT auth
- Whisper voice pipeline (multi-language) + entity extraction service
- ML price model training/serving
- Solidity escrow contract + Hardhat deploy to Polygon Mumbai + web3.py glue

Happy to build any of these next — say which and I'll build it the same way:
real, runnable code, not a mockup.
