import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Share2, Plus } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'

export default function ListingPublished() {
  const nav = useNavigate()
  const { state } = useLocation()
  const id = state?.id || 'VL-1042'

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="w-20 h-20 rounded-full bg-growth flex items-center justify-center mb-5"
      >
        <Check size={36} color="white" strokeWidth={3} />
      </motion.div>

      <h1 className="font-display text-2xl font-bold text-ink mb-1">Listing published!</h1>
      <p className="text-ink-soft mb-6">Buyers nearby can now see your listing.</p>

      <Card className="w-full max-w-sm p-5 text-left mb-6" hover={false}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink-faint">Listing ID</span>
          <span className="font-semibold text-ink">{id}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink-faint">Estimated buyer reach</span>
          <span className="font-semibold text-ink">~120 buyers</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-faint">Status</span>
          <span className="font-semibold text-growth">Active</span>
        </div>
      </Card>

      <div className="w-full max-w-sm space-y-2">
        <Button full variant="outline" icon={Share2}>Share listing</Button>
        <Button full icon={Plus} onClick={() => nav('/voice')}>Create another listing</Button>
        <Button full variant="ghost" onClick={() => nav('/listings')}>Go to my listings</Button>
      </div>
    </div>
  )
}
