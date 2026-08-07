import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, Mic, TrendingUp, TrendingDown, Eye, Users, MoreHorizontal, Lock, CheckCircle2, Search, Loader2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'
import NegotiateModal from '../components/NegotiateModal'
import { useStore } from '../store/useStore'
import { useT } from '../lib/i18n'
import { marketApi } from '../lib/api'

const LANGS = [
  { code: 'ta', label: 'Tamil' }, { code: 'hi', label: 'Hindi' }, { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' }, { code: 'en', label: 'English' },
]

const REQUESTS = [
  { id: 'BR-201', buyer: 'FreshFoods Inc.', location: 'Chennai', price: 24, qty: 400, unit: 'kg' },
]

// Static fallback shown until the backend responds (or if it's unreachable),
// so the card never renders empty.
const FALLBACK_INSIGHTS = {
  prices: [
    { crop: 'Tomatoes', region: 'Chennai', price: 28, trend: 'up', recommendation: 'sell_now' },
    { crop: 'Onions', region: 'Nashik', price: 19, trend: 'down', recommendation: 'hold' },
  ],
  high_demand_crops: ['Tomatoes', 'Cotton', 'Maize'],
}

function Counter({ value, prefix = '' }) {
  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>{prefix}{value.toLocaleString('en-IN')}</motion.span>
}

export default function Dashboard() {
  const nav = useNavigate()
  const { user, stats, listings, language, setLanguage } = useStore()
  const t = useT()
  const [insights, setInsights] = useState(FALLBACK_INSIGHTS)
  const [insightsLive, setInsightsLive] = useState(false)
  const [insightsError, setInsightsError] = useState(null)
  const [negotiating, setNegotiating] = useState(null) // request currently in the modal
  const [offers, setOffers] = useState({}) // { [requestId]: counterPrice }

  const [citySearch, setCitySearch] = useState('')
  const [cityBreakdown, setCityBreakdown] = useState(null) // real, per-city demand from the model
  const [cityLoading, setCityLoading] = useState(false)
  const [cityError, setCityError] = useState(null)

  const searchCityDemand = (e) => {
    e?.preventDefault?.()
    const city = citySearch.trim()
    if (!city) return
    setCityLoading(true)
    setCityError(null)
    marketApi.insights(city)
      .then(({ data }) => {
        if (!data?.city_breakdown) {
          setCityBreakdown(null)
          setCityError('No live data for that city yet')
          return
        }
        setCityBreakdown(data.city_breakdown)
      })
      .catch((err) => {
        console.error('city market-insights fetch failed:', err)
        setCityBreakdown(null)
        setCityError('Could not fetch live demand for that city')
      })
      .finally(() => setCityLoading(false))
  }

  const sendCounterOffer = ({ requestId, price }) => {
    setOffers((prev) => ({ ...prev, [requestId]: price }))
    setNegotiating(null)
  }

  useEffect(() => {
    let cancelled = false
    marketApi.insights()
      .then(({ data }) => { if (!cancelled && data) { setInsights(data); setInsightsLive(true); setInsightsError(null) } })
      .catch((err) => {
        if (cancelled) return
        // Surface *why* we're showing demo data instead of hiding it —
        // "not logged in" and "backend/DB unreachable" need different fixes.
        console.error('market-insights fetch failed:', err)
        setInsightsError(
          /401|not authenticated|unauthor|invalid or expired token/i.test(err.message || '')
            ? 'Log in to see live prices'
            : 'Live prices unavailable — showing sample data'
        )
      })
    return () => { cancelled = true }
  }, [])

  const topRec = insights.prices.find((p) => p.recommendation === 'sell_now') || insights.prices[0]

  return (
    <PageShell wide>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-ink">{t('dashboard_title')}</h1>
          <p className="text-sm text-ink-soft">{t('welcome_back')}, {user?.name || 'Farmer'}! · {user?.district || 'Tamil Nadu'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1 bg-white rounded-full px-2 py-1.5 shadow-card">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                  language === l.code ? 'bg-forest text-white' : 'text-ink-soft hover:bg-growth-pale hover:text-forest'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={() => nav('/notifications')} aria-label="Notifications" className="relative w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-card">
            <Bell size={19} className="text-forest" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-sun rounded-full" />
          </button>
          <button onClick={() => nav('/profile')} className="flex items-center gap-2 bg-white rounded-full pl-1.5 pr-3 py-1.5 shadow-card min-h-[44px]">
            <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center text-xs font-bold">
              {(user?.name || 'F')[0]}
            </div>
            <span className="text-xs font-medium text-ink hidden sm:inline">{user?.name || 'Farmer'}</span>
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('active_listings'), value: stats.activeListings, sub: `${listings.length} total` },
          { label: t('nav_orders'), value: stats.orders, sub: 'this month' },
          { label: t('total_earnings'), value: stats.earnings, prefix: '₹', sub: 'lifetime' },
          { label: t('wallet_balance'), value: stats.wallet, prefix: '₹', sub: 'available' },
        ].map((s) => (
          <Card key={s.label} className="p-4" hover>
            <p className="text-xs text-ink-faint mb-1">{s.label}</p>
            <p className="font-display text-xl font-bold text-forest"><Counter value={s.value} prefix={s.prefix || ''} /></p>
            <p className="text-[11px] text-ink-faint mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button icon={Mic} onClick={() => nav('/voice')}>{t('speak_new_listing')}</Button>
        <Button variant="outline" onClick={() => nav('/listings?add=1')}>{t('post_listing')}</Button>
        <Button variant="outline" onClick={() => nav('/listings')}>{t('nav_listings')}</Button>
        <Button variant="outline" onClick={() => nav('/wallet')}>{t('view_payments')}</Button>
      </div>

      {/* Main grid: listings/requests (2 cols) + AI insights (1 col) */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold text-ink-soft uppercase tracking-wide">{t('nav_listings')}</h2>
              <button onClick={() => nav('/listings')} className="text-xs font-semibold text-forest">View all</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {listings.slice(0, 2).map((l) => (
                <Card key={l.id} className="p-4" hover>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-growth-pale flex items-center justify-center text-xl">{l.image}</div>
                      <div>
                        <p className="font-semibold text-sm text-ink">{l.crop}</p>
                        <p className="text-xs text-ink-faint">{l.location}</p>
                      </div>
                    </div>
                    <button aria-label="More options" className="text-ink-faint"><MoreHorizontal size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-ink-soft mb-3">
                    <span>Qty: <b className="text-ink">{l.quantity} {l.unit}</b></span>
                    <span>Price: <b className="text-forest">₹{l.price}/{l.unit}</b></span>
                    <span className="flex items-center gap-1"><Eye size={11} /> {l.views}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {l.interest}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 text-xs font-medium border border-black/10 rounded-lg py-2 min-h-[36px]" onClick={() => nav('/listings')}>Edit</button>
                    <button className="flex-1 text-xs font-medium border border-black/10 rounded-lg py-2 min-h-[36px]" onClick={() => nav('/listings')}>Pause</button>
                    <button className="flex-1 text-xs font-medium border border-red-200 text-red-500 rounded-lg py-2 min-h-[36px]" onClick={() => nav('/listings')}>Delete</button>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold text-ink-soft uppercase tracking-wide">{t('nav_requests')}</h2>
              <button onClick={() => nav('/requests')} className="text-xs font-semibold text-forest">View all</button>
            </div>
            {REQUESTS.map((r) => {
              const sentOffer = offers[r.id]
              return (
                <Card key={r.buyer} className="p-4" hover={false}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm text-ink">Buyer: {r.buyer} <span className="text-ink-faint font-normal">({r.location})</span></p>
                    <p className="font-display font-bold text-forest">₹{r.price}/{r.unit}</p>
                  </div>
                  <p className="text-xs text-ink-soft mb-3">Qty: {r.qty} {r.unit} · Delivery: {r.location}</p>

                  {sentOffer ? (
                    <div className="flex items-center gap-2 bg-growth-pale text-forest text-xs font-medium rounded-xl px-3 py-2.5">
                      <CheckCircle2 size={15} />
                      Counter-offer sent: ₹{sentOffer}/{r.unit} — waiting on buyer
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="primary" className="!px-3 !py-2 text-xs" onClick={() => nav('/orders/BR-201')}>Accept</Button>
                      <Button variant="outline" className="!px-3 !py-2 text-xs" onClick={() => setNegotiating(r)}>Negotiate</Button>
                      <Button variant="danger" className="!px-3 !py-2 text-xs">Reject</Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold text-ink-soft uppercase tracking-wide">Escrow Payment Update</h2>
              <button onClick={() => nav('/escrow/BR-201')} className="text-xs font-semibold text-forest">View</button>
            </div>
            <Card className="p-4 flex items-center gap-4" hover={false}>
              <div className="w-10 h-10 rounded-full bg-sun/20 flex items-center justify-center shrink-0"><Lock size={17} className="text-sun-dark" /></div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><p className="text-ink-faint">Order ID</p><p className="font-semibold text-ink">VL789123</p></div>
                <div><p className="text-ink-faint">Amount</p><p className="font-semibold text-ink">₹12,500</p></div>
                <div><p className="text-ink-faint">Status</p><p className="font-semibold text-sun-dark">Escrow Locked</p></div>
                <div><p className="text-ink-faint">Blockchain ID</p><p className="font-mono font-semibold text-forest">0xAb1C…</p></div>
              </div>
            </Card>
          </section>
        </div>

        {/* AI insights sidebar */}
        <div className="space-y-4">
          <Card className="p-5 bg-gradient-to-br from-forest to-forest-dark text-white" hover={false}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold">{t('ai_market_insights')}</p>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${insightsLive ? 'bg-growth/30 text-white' : 'bg-white/10 text-white/60'}`}
                title={insightsError || undefined}
              >
                {insightsLive ? 'Live' : 'Demo data'}
              </span>
            </div>
            {insightsError && (
              <p className="text-[11px] text-sun/90 -mt-1 mb-2">{insightsError}</p>
            )}
            <p className="text-xs text-white/70 mb-2">{t('todays_prices')}</p>
            <div className="space-y-2 mb-4">
              {insights.prices.slice(0, 3).map((p, i) => (
                <motion.div
                  key={p.crop}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className="flex justify-between text-sm"
                >
                  <span>{p.crop} <span className="text-white/50">{p.region}</span></span>
                  <span className={`flex items-center gap-1 font-semibold ${p.trend === 'up' ? 'text-sun' : p.trend === 'down' ? 'text-red-300' : 'text-white/80'}`}>
                    {p.trend === 'up' ? <TrendingUp size={13} /> : p.trend === 'down' ? <TrendingDown size={13} /> : null}
                    ₹{p.price}/kg
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-white/70 mb-1">{t('high_demand_crops')}</p>
            <p className="text-sm font-medium mb-4">{insights.high_demand_crops.join(', ') || '—'}</p>

            <div className="border-t border-white/10 pt-3 mb-1">
              <p className="text-xs text-white/70 mb-2">Check demand in a city</p>
              <form onSubmit={searchCityDemand} className="flex items-center gap-2 mb-3">
                <input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="flex-1 min-w-0 bg-white/10 placeholder-white/40 text-sm text-white rounded-lg px-3 py-2 outline-none focus:bg-white/15"
                />
                <button
                  type="submit"
                  disabled={cityLoading || !citySearch.trim()}
                  aria-label="Search city demand"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-sun text-forest-dark disabled:opacity-50"
                >
                  {cityLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </form>

              {cityError && <p className="text-xs text-sun/90 -mt-2 mb-3">{cityError}</p>}

              {cityBreakdown && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-2">
                  <p className="text-xs text-white/60">Live demand in {cityBreakdown.city}</p>
                  <div>
                    <p className="text-[11px] text-white/70 mb-1">🔥 High demand</p>
                    <p className="text-sm font-medium">{cityBreakdown.high_demand_crops.join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70 mb-1">📉 Low demand</p>
                    <p className="text-sm font-medium text-white/80">{cityBreakdown.low_demand_crops.join(', ') || '—'}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {topRec && (
              <div className="bg-sun/15 rounded-xl p-3">
                <span className="inline-block bg-sun text-forest-dark text-[11px] font-bold rounded-full px-2.5 py-1 mb-2">
                  {topRec.recommendation === 'sell_now' ? t('sell_now') : topRec.recommendation === 'hold' ? 'HOLD' : 'WATCH'}
                </span>
                <div className="flex items-center gap-1 text-xs text-sun">
                  <TrendingUp size={13} /> {topRec.crop} · ₹{topRec.price}/kg in {topRec.region}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <NegotiateModal
        open={Boolean(negotiating)}
        request={negotiating}
        onClose={() => setNegotiating(null)}
        onSubmit={sendCounterOffer}
      />
    </PageShell>
  )
}
