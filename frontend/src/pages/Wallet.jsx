import PageShell from '../components/PageShell'
import Card from '../components/Card'
import { useStore } from '../store/useStore'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'

const HISTORY = [
  { type: 'credit', label: 'Payment · Tomatoes order', amount: 5200, date: '12 Aug' },
  { type: 'debit', label: 'Withdrawal to bank', amount: 4000, date: '10 Aug' },
  { type: 'credit', label: 'Payment · Turmeric order', amount: 13800, date: '2 Aug' },
]

export default function Wallet() {
  const stats = useStore((s) => s.stats)
  return (
    <PageShell>
      <h1 className="font-display text-xl font-bold mb-5">Wallet & earnings</h1>
      <Card className="p-5 bg-forest text-white mb-4" hover={false}>
        <p className="text-xs text-white/70">Total earnings</p>
        <p className="font-display text-3xl font-bold">₹{stats.earnings.toLocaleString('en-IN')}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="p-4" hover={false}><p className="text-xs text-ink-faint">Pending</p><p className="font-bold text-lg">₹{Math.round(stats.wallet * 0.4).toLocaleString('en-IN')}</p></Card>
        <Card className="p-4" hover={false}><p className="text-xs text-ink-faint">Completed</p><p className="font-bold text-lg">₹{Math.round(stats.wallet * 0.6).toLocaleString('en-IN')}</p></Card>
      </div>
      <h2 className="font-display text-sm font-bold text-ink-soft uppercase tracking-wide mb-2">Withdrawal history</h2>
      <div className="space-y-2">
        {HISTORY.map((h, i) => (
          <Card key={i} className="p-4 flex items-center gap-3" hover={false}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${h.type === 'credit' ? 'bg-growth-pale' : 'bg-black/5'}`}>
              {h.type === 'credit' ? <ArrowDownLeft size={15} className="text-growth" /> : <ArrowUpRight size={15} className="text-ink-faint" />}
            </div>
            <div className="flex-1"><p className="text-sm font-medium text-ink">{h.label}</p><p className="text-xs text-ink-faint">{h.date}</p></div>
            <p className={`text-sm font-semibold ${h.type === 'credit' ? 'text-growth' : 'text-ink-faint'}`}>{h.type === 'credit' ? '+' : '-'}₹{h.amount.toLocaleString('en-IN')}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
