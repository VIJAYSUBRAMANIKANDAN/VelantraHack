import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Camera, Check } from 'lucide-react'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'

export default function DeliveryConfirmation() {
  const nav = useNavigate()
  const { id } = useParams()
  const [photo, setPhoto] = useState(false)
  const [marked, setMarked] = useState(false)

  return (
    <PageShell>
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-bold">Confirm delivery</h1>
      </header>

      <button
        onClick={() => setPhoto(true)}
        className={`w-full aspect-video rounded-xl2 border-2 border-dashed flex flex-col items-center justify-center gap-2 mb-4
          ${photo ? 'border-growth bg-growth-pale' : 'border-black/15 bg-white'}`}
      >
        {photo ? <Check size={28} className="text-growth" /> : <Camera size={28} className="text-ink-faint" />}
        <span className="text-sm font-medium text-ink-soft">{photo ? 'Photo added' : 'Upload delivery photo'}</span>
      </button>

      <Card className="p-4 flex items-center justify-between mb-5" hover={false}>
        <span className="text-sm font-medium">Buyer confirmation</span>
        <span className="text-xs font-semibold bg-sun/20 text-sun-dark rounded-full px-3 py-1">Awaiting buyer</span>
      </Card>

      <Button full disabled={marked} onClick={() => setMarked(true)}>
        {marked ? 'Marked as delivered ✓' : 'Mark as delivered'}
      </Button>
      {marked && <Button full variant="outline" className="mt-2" onClick={() => nav('/escrow/' + id)}>Back to escrow</Button>}
    </PageShell>
  )
}
