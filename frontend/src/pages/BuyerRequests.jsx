import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, CheckCircle2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'
import NegotiateModal from '../components/NegotiateModal'

const REQUESTS = [
  { id: 'BR-201', buyer: 'Ramesh Traders', price: 26, qty: 200, unit: 'kg', location: 'Salem Market Yard' },
  { id: 'BR-202', buyer: 'Kaveri Agro Foods', price: 24, qty: 500, unit: 'kg', location: 'Erode' },
]

export default function BuyerRequests() {
  const nav = useNavigate()
  const [negotiating, setNegotiating] = useState(null) // request currently in the modal
  const [offers, setOffers] = useState({}) // { [requestId]: counterPrice }

  const sendCounterOffer = ({ requestId, price }) => {
    setOffers((prev) => ({ ...prev, [requestId]: price }))
    setNegotiating(null)
  }

  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Buyer requests</h1>
      </header>
      <div className="space-y-3">
        {REQUESTS.map((r) => {
          const sentOffer = offers[r.id]
          return (
            <Card key={r.id} className="p-4" hover>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-ink">{r.buyer}</p>
                  <p className="text-xs text-ink-faint flex items-center gap-1 mt-0.5"><MapPin size={12} /> {r.location}</p>
                </div>
                <p className="font-display font-bold text-forest">₹{r.price}/{r.unit}</p>
              </div>
              <p className="text-sm text-ink-soft mb-3">Requesting {r.qty} {r.unit}</p>

              {sentOffer ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-growth-pale text-forest text-xs font-medium rounded-xl px-3 py-2.5"
                >
                  <CheckCircle2 size={15} />
                  Counter-offer sent: ₹{sentOffer}/{r.unit} — waiting on buyer
                </motion.div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="primary" className="!px-2 !py-2.5 text-xs" onClick={() => nav('/orders/' + r.id)}>Accept</Button>
                  <Button variant="outline" className="!px-2 !py-2.5 text-xs" onClick={() => setNegotiating(r)}>Negotiate</Button>
                  <Button variant="danger" className="!px-2 !py-2.5 text-xs">Reject</Button>
                </div>
              )}
            </Card>
          )
        })}
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
