import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { listingsApi } from '../lib/api'

// recommendation values from the backend are 'sell_now' | 'hold' | 'watch'
// (see FairPriceResponse in schemas.py) — map straight through, no local
// re-derivation of the call.
const REC_COPY = {
  sell_now: { label: '✅ Sell now', body: "Price is near its recent peak — this is a strong time to publish your listing." },
  watch: { label: '👀 Good time to list', body: 'Prices are healthy and steady. Publishing now should attract good offers.' },
  hold: { label: '⏳ Consider holding', body: 'Prices have been softening. You can still publish now, or wait a few days.' },
}

export default function FairPrice() {
  const nav = useNavigate()
  const { draftListing, confirmDraftListing } = useStore()
  const farmerPrice = Number(draftListing?.price || 25)

  const [aiResult, setAiResult] = useState(null) // { ai_suggested_price, confidence, market_trend, recommendation }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listingsApi
      .fairPrice({
        crop_name: draftListing?.crop || 'Tomato',
        quantity: Number(draftListing?.quantity || 1),
        region: draftListing?.location || '',
        harvest_date: draftListing?.harvest_date || null,
      })
      .then(({ data }) => {
        if (cancelled) return
        setAiResult(data)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('fair-price fetch failed:', err)
        // The endpoint doesn't require login — it's a stateless model
        // prediction from crop/region/date — so a failure here means the
        // backend/model is actually unreachable, not that the person is
        // logged out.
        setError('AI price unavailable right now — check your connection and try again')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [draftListing])

  // No fallback math here on purpose: showing a locally-guessed number
  // (e.g. farmerPrice * 1.08) while pretending it's the AI price is fake
  // data. Until the real prediction loads, aiPrice is null and the UI
  // shows a loading state instead.
  const aiPrice = aiResult?.ai_suggested_price ?? null
  const trend = aiResult?.market_trend || 'stable'
  const recommendation = aiResult?.recommendation || 'watch'
  const confidence = aiResult?.confidence

  const publish = async () => {
    const listing = await confirmDraftListing()
    nav('/voice/published', { state: { id: listing?.id } })
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-5 pt-6 flex items-center gap-3 max-w-lg mx-auto w-full">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">AI fair price</h1>
      </header>

      <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-lg mx-auto w-full px-5 pb-8 mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4" hover={false}>
            <p className="text-xs text-ink-faint mb-1">Your price</p>
            <p className="font-display text-2xl font-bold text-ink">₹{farmerPrice}</p>
            <p className="text-xs text-ink-faint">per kg</p>
          </Card>
          <Card className="p-4 bg-forest text-white" hover={false}>
            <p className="text-xs text-white/70 mb-1">AI suggested</p>
            <p className="font-display text-2xl font-bold">
              {aiPrice != null ? `₹${aiPrice}` : <span className="inline-block w-12 h-6 rounded bg-white/20 animate-pulse align-middle" />}
            </p>
            <p className="text-xs text-white/70">per kg</p>
          </Card>
        </div>

        {error && <p className="text-xs text-sun-dark -mt-1">{error}</p>}

        <Card className="p-4" hover={false}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-ink">Market trend</p>
            <span className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-growth' : trend === 'down' ? 'text-red-500' : 'text-ink-faint'}`}>
              {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Steady'}
            </span>
          </div>
          <p className="text-xs text-ink-faint">
            {loading ? 'Checking recent mandi prices…' : `Based on recent mandi price movement${confidence != null ? ` · ${Math.round(confidence * 100)}% model confidence` : ''}`}
          </p>
        </Card>

        <Card className={`p-5 ${recommendation === 'sell_now' ? 'bg-sun/15' : 'bg-white'}`} hover={false}>
          <p className="font-display font-bold text-ink mb-1">{REC_COPY[recommendation]?.label}</p>
          <p className="text-sm text-ink-soft">{REC_COPY[recommendation]?.body}</p>
        </Card>

        <Button full disabled={loading || aiPrice == null} onClick={publish}>
          {aiPrice != null ? `Publish listing at ₹${aiPrice}/kg` : 'Getting live AI price…'}
        </Button>
      </motion.main>
    </div>
  )
}
