import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Lock, CheckCircle2, Link as LinkIcon } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Escrow() {
  const nav = useNavigate()
  const { id } = useParams()
  const [status, setStatus] = useState('locked') // locked | released
  const total = 5200
  const txId = '0x8f3a...c21e'

  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Escrow payment</h1>
      </header>

      <Card className="p-6 text-center mb-4" hover={false}>
        <motion.div
          animate={status === 'locked' ? { rotate: [0, -6, 6, 0] } : { scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6 }}
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${status === 'locked' ? 'bg-sun/20' : 'bg-growth-pale'}`}
        >
          {status === 'locked' ? <Lock size={26} className="text-sun-dark" /> : <CheckCircle2 size={26} className="text-growth" />}
        </motion.div>
        <p className="font-display text-2xl font-bold">₹{total.toLocaleString('en-IN')}</p>
        <p className="text-sm text-ink-faint mt-1">{status === 'locked' ? 'Payment locked in escrow' : 'Payment released to your wallet'}</p>
      </Card>

      <Card className="p-4 space-y-2 text-sm" hover={false}>
        <div className="flex justify-between"><span className="text-ink-faint">Order</span><span className="font-medium">{id}</span></div>
        <div className="flex justify-between"><span className="text-ink-faint">Status</span>
          <span className={`font-medium capitalize ${status === 'locked' ? 'text-sun-dark' : 'text-growth'}`}>{status}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-ink-faint">Blockchain tx</span>
          <span className="font-mono text-xs flex items-center gap-1 text-forest"><LinkIcon size={12} /> {txId}</span>
        </div>
      </Card>

      {status === 'locked' && (
        <Button full className="mt-5" onClick={() => setStatus('released')}>Confirm delivery to release payment</Button>
      )}
      {status === 'released' && (
        <Button full className="mt-5" onClick={() => nav('/payment-received/' + id)}>View receipt</Button>
      )}
      <p className="text-xs text-ink-faint text-center mt-3">Secured on Polygon Mumbai testnet via smart contract escrow.</p>
    </PageShell>
  )
}
