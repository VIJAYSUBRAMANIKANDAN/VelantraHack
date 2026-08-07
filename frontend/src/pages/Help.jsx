import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mic, MessageCircle, Phone, Flag } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'

const FAQS = [
  'How do I create a voice listing?',
  'How does escrow payment work?',
  'When do I receive my payment?',
  'How is the AI fair price calculated?',
]

export default function Help() {
  const nav = useNavigate()
  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Help & support</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="p-4 flex flex-col items-center text-center gap-2" hover>
          <div className="w-10 h-10 rounded-full bg-growth-pale flex items-center justify-center"><Mic size={18} className="text-forest" /></div>
          <span className="text-sm font-medium">Voice assistant</span>
        </Card>
        <Card className="p-4 flex flex-col items-center text-center gap-2" hover>
          <div className="w-10 h-10 rounded-full bg-growth-pale flex items-center justify-center"><Phone size={18} className="text-forest" /></div>
          <span className="text-sm font-medium">Contact support</span>
        </Card>
      </div>

      <h2 className="font-display text-sm font-bold text-ink-soft uppercase tracking-wide mb-2">FAQ</h2>
      <Card className="divide-y divide-black/5 mb-4" hover={false}>
        {FAQS.map((q) => (
          <button key={q} className="w-full flex items-center justify-between px-4 py-3.5 min-h-[44px] text-left text-sm text-ink">
            {q}
          </button>
        ))}
      </Card>

      <button className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 min-h-[44px]">
        <Flag size={16} /> Report an issue
      </button>
    </PageShell>
  )
}
