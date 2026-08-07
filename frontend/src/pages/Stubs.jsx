import PageShell from '../components/PageShell'
import Card from '../components/Card'
import { Bell, ChevronRight, User, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

export function Notifications() {
  const items = [
    { text: 'A buyer is interested in your Tomatoes listing', time: '2h ago' },
    { text: 'New order received from Ramesh Traders', time: '5h ago' },
    { text: 'Market price for Onions updated', time: '1d ago' },
    { text: 'Payment released for order OD-480', time: '2d ago' },
    { text: 'Your Turmeric listing expires in 3 days', time: '3d ago' },
  ]
  return (
    <PageShell>
      <h1 className="font-display text-xl font-bold mb-5">Notifications</h1>
      <div className="space-y-2">
        {items.map((n, i) => (
          <Card key={i} className="p-4 flex items-center gap-3" hover={false}>
            <div className="w-10 h-10 rounded-full bg-growth-pale flex items-center justify-center shrink-0"><Bell size={16} className="text-forest" /></div>
            <div><p className="text-sm text-ink">{n.text}</p><p className="text-xs text-ink-faint">{n.time}</p></div>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}

export function Profile() {
  const { user, logout } = useStore()
  const nav = useNavigate()
  const rows = [
    { label: 'Edit profile', to: '/profile' },
    { label: 'Settings', to: '/settings' },
    { label: 'Help & support', to: '/help' },
  ]
  return (
    <PageShell>
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-forest flex items-center justify-center text-white font-display text-2xl font-bold mb-3">
          {(user?.name || 'F')[0]}
        </div>
        <h1 className="font-display text-lg font-bold">{user?.name || 'Farmer'}</h1>
        <p className="text-sm text-ink-faint">{user?.village || 'Salem'}, {user?.district || 'Tamil Nadu'}</p>
        <span className="mt-2 text-xs font-semibold bg-sun/20 text-sun-dark rounded-full px-3 py-1">KYC {user?.kycStatus || 'verified'}</span>
      </div>
      <Card className="divide-y divide-black/5" hover={false}>
        {rows.map((r) => (
          <button key={r.label} onClick={() => nav(r.to)} className="w-full flex items-center justify-between px-4 py-3.5 min-h-[44px]">
            <span className="flex items-center gap-3 text-sm font-medium text-ink"><User size={17} className="text-forest" /> {r.label}</span>
            <ChevronRight size={16} className="text-ink-faint" />
          </button>
        ))}
      </Card>
      <button onClick={() => { logout(); nav('/') }} className="w-full flex items-center justify-center gap-2 text-red-500 font-medium mt-5 py-3 min-h-[44px]">
        <LogOut size={17} /> Logout
      </button>
    </PageShell>
  )
}
