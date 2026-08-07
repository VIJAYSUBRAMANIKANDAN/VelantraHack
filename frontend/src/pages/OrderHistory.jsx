import { useState } from 'react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'

const TABS = ['Pending', 'Accepted', 'Completed', 'Cancelled']
const ORDERS = {
  Pending: [{ id: 'OD-501', buyer: 'Kaveri Agro', crop: 'Onions', qty: '500 kg' }],
  Accepted: [{ id: 'OD-499', buyer: 'Ramesh Traders', crop: 'Tomatoes', qty: '200 kg' }],
  Completed: [{ id: 'OD-480', buyer: 'Sri Balaji Foods', crop: 'Turmeric', qty: '150 kg' }],
  Cancelled: [],
}

export default function OrderHistory() {
  const [tab, setTab] = useState('Pending')
  return (
    <PageShell>
      <h1 className="font-display text-xl font-bold mb-4">Order history</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm font-medium px-3.5 py-2 rounded-full min-h-[44px] whitespace-nowrap ${tab === t ? 'bg-forest text-white' : 'bg-white text-ink-soft'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {ORDERS[tab].length === 0 && <p className="text-sm text-ink-faint text-center py-10">No {tab.toLowerCase()} orders</p>}
        {ORDERS[tab].map((o) => (
          <Card key={o.id} className="p-4" hover={false}>
            <p className="font-semibold text-ink">{o.buyer}</p>
            <p className="text-sm text-ink-soft">{o.crop} · {o.qty}</p>
            <p className="text-xs text-ink-faint mt-1">{o.id}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
