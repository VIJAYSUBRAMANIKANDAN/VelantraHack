import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Download, CheckCircle2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'

export default function PaymentReceived() {
  const nav = useNavigate()
  const { id } = useParams()

  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Payment received</h1>
      </header>

      <Card className="p-6 text-center mb-4" hover={false}>
        <CheckCircle2 size={40} className="text-growth mx-auto mb-2" />
        <p className="font-display text-3xl font-bold text-forest">₹5,200</p>
        <p className="text-sm text-ink-faint mt-1">Received on 12 Aug 2026</p>
      </Card>

      <Card className="p-4 space-y-2 text-sm" hover={false}>
        <div className="flex justify-between"><span className="text-ink-faint">Order</span><span className="font-medium">{id}</span></div>
        <div className="flex justify-between"><span className="text-ink-faint">Transaction ID</span><span className="font-mono text-xs">0x8f3a...c21e</span></div>
      </Card>

      <Button full icon={Download} className="mt-5">Download receipt</Button>
    </PageShell>
  )
}
