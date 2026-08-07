import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Globe, Volume2, Bell, Shield, HelpCircle, Info } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'

const ROWS = [
  { icon: Globe, label: 'Language', value: 'English' },
  { icon: Volume2, label: 'Voice settings', value: 'On' },
  { icon: Bell, label: 'Notification settings', value: 'All' },
  { icon: Shield, label: 'Privacy', value: '' },
  { icon: HelpCircle, label: 'Help & support', value: '', to: '/help' },
  { icon: Info, label: 'About Velantra', value: 'v0.1.0' },
]

export default function Settings() {
  const nav = useNavigate()
  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </header>
      <Card className="divide-y divide-black/5" hover={false}>
        {ROWS.map((r) => (
          <button key={r.label} onClick={() => r.to && nav(r.to)} className="w-full flex items-center justify-between px-4 py-3.5 min-h-[44px]">
            <span className="flex items-center gap-3 text-sm font-medium text-ink"><r.icon size={17} className="text-forest" /> {r.label}</span>
            <span className="flex items-center gap-1 text-xs text-ink-faint">{r.value} <ChevronRight size={15} /></span>
          </button>
        ))}
      </Card>
    </PageShell>
  )
}
