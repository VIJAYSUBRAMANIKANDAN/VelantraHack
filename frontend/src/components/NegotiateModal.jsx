import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Send } from 'lucide-react'
import Button from './Button'

// Shared counter-offer sheet used by every "Negotiate" button in the app
// (Dashboard's requests card, Buyer Requests list, etc). Keeping it as one
// component means the negotiate flow behaves — and gets fixed — the same
// way everywhere it appears.
export default function NegotiateModal({ open, request, onClose, onSubmit }) {
  const [price, setPrice] = useState(request?.price || 0)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setPrice(request?.price || 0)
      setNote('')
    }
  }, [open, request])

  if (!request) return null

  const step = (delta) => setPrice((p) => Math.max(1, Number((p + delta).toFixed(2))))

  const submit = (e) => {
    e.preventDefault()
    onSubmit?.({ requestId: request.id, price, note })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Negotiate price"
            className="fixed left-0 right-0 bottom-0 z-50 bg-cream rounded-t-[1.75rem] p-6 pb-8 max-w-lg mx-auto shadow-2xl"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Negotiate price</h3>
                <p className="text-xs text-ink-faint mt-0.5">
                  With {request.buyer} · {request.qty} {request.unit || 'kg'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 text-ink-faint"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit}>
              <p className="text-xs text-ink-soft mb-2">
                Buyer offered <b className="text-ink">₹{request.price}/{request.unit || 'kg'}</b> — send your counter-offer
              </p>

              <div className="flex items-center justify-center gap-4 bg-white rounded-2xl p-4 mb-4 shadow-card">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Decrease price"
                  className="w-11 h-11 rounded-full border border-black/10 flex items-center justify-center text-forest hover:bg-growth-pale"
                >
                  <Minus size={18} />
                </button>
                <div className="text-center">
                  <span className="font-display text-3xl font-extrabold text-forest">₹{price}</span>
                  <p className="text-[11px] text-ink-faint mt-0.5">per {request.unit || 'kg'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Increase price"
                  className="w-11 h-11 rounded-full border border-black/10 flex items-center justify-center text-forest hover:bg-growth-pale"
                >
                  <Plus size={18} />
                </button>
              </div>

              <label className="block mb-5">
                <span className="block text-sm font-medium text-ink-soft mb-1.5">Message (optional)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Can deliver by Friday at this price"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] placeholder:text-ink-faint focus:border-forest transition-colors resize-none"
                />
              </label>

              <Button full type="submit" icon={Send}>Send counter-offer</Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
