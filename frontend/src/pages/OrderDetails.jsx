import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Calendar, User } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'

export default function OrderDetails() {
  const nav = useNavigate()
  const { id } = useParams()
  const order = {
    id: id || 'BR-201', buyer: 'Ramesh Traders', crop: 'Tomatoes', qty: 200, unit: 'kg',
    price: 26, address: 'Plot 12, Salem Market Yard, Salem, TN 636001',
    date: '12 Aug 2026', status: 'Accepted',
  }
  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Order {order.id}</h1>
      </header>

      <Card className="p-5 space-y-4" hover={false}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-growth-pale flex items-center justify-center"><User size={17} className="text-forest" /></div>
          <div><p className="font-semibold text-ink">{order.buyer}</p><p className="text-xs text-ink-faint">Buyer</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-ink-faint text-xs">Crop</p><p className="font-medium">{order.crop}</p></div>
          <div><p className="text-ink-faint text-xs">Quantity</p><p className="font-medium">{order.qty} {order.unit}</p></div>
          <div><p className="text-ink-faint text-xs">Agreed price</p><p className="font-medium text-forest">₹{order.price}/{order.unit}</p></div>
          <div><p className="text-ink-faint text-xs">Status</p><p className="font-medium text-growth">{order.status}</p></div>
        </div>
        <div className="pt-2 border-t border-black/5 space-y-2">
          <p className="text-sm flex items-start gap-2"><MapPin size={15} className="mt-0.5 text-ink-faint shrink-0" /> {order.address}</p>
          <p className="text-sm flex items-center gap-2"><Calendar size={15} className="text-ink-faint shrink-0" /> Delivery by {order.date}</p>
        </div>
      </Card>

      <div className="mt-5 space-y-2">
        <Button full onClick={() => nav('/escrow/' + order.id)}>Proceed to escrow payment</Button>
        <Button full variant="outline" onClick={() => nav('/delivery/' + order.id)}>Mark as delivered</Button>
      </div>
    </PageShell>
  )
}
