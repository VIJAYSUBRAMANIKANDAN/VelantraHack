import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Users, Pause, Play, Pencil, Trash2, Plus, X, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { useStore } from '../store/useStore'

const STATUS_STYLE = {
  active: 'bg-growth-pale text-forest',
  paused: 'bg-black/5 text-ink-faint',
  sold: 'bg-sun/20 text-sun-dark',
}
const CROP_EMOJI = { Tomatoes: '🍅', Onions: '🧅', Turmeric: '🌾', Chillies: '🌶️', Rice: '🌾', Cotton: '☁️', Maize: '🌽' }

function AddListingModal({ onClose }) {
  const addListing = useStore((s) => s.confirmDraftListing)
  const setDraft = useStore((s) => s.setDraftListing)
  const [form, setForm] = useState({ crop: '', quantity: '', unit: 'kg', price: '', location: '', quality: 'Grade A' })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (!form.crop || !form.quantity || !form.price || !form.location) return
    setDraft({
      crop: form.crop,
      quantity: Number(form.quantity),
      unit: form.unit,
      price: Number(form.price),
      location: form.location,
      quality: form.quality,
      image: CROP_EMOJI[form.crop] || '🌱',
    })
    await addListing()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Add a crop listing</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5"><X size={18} /></button>
        </div>

        <button
          type="button"
          onClick={() => nav('/voice')}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-growth/40 text-forest text-sm font-medium rounded-xl py-3 mb-4 min-h-[44px]"
        >
          <Mic size={16} /> Or speak this listing instead
        </button>

        <form onSubmit={submit} className="space-y-3">
          <Input label="Crop name" placeholder="e.g. Tomatoes" value={form.crop} onChange={update('crop')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" placeholder="500" value={form.quantity} onChange={update('quantity')} required />
            <label className="block">
              <span className="block text-sm font-medium text-ink-soft mb-1.5">Unit</span>
              <select value={form.unit} onChange={update('unit')} className="w-full min-h-[44px] rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px]">
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="ton">ton</option>
              </select>
            </label>
          </div>
          <Input label="Expected price (₹/unit)" type="number" placeholder="25" value={form.price} onChange={update('price')} required />
          <Input label="Location" placeholder="e.g. Salem" value={form.location} onChange={update('location')} required />
          <Input label="Quality grade" placeholder="Grade A" value={form.quality} onChange={update('quality')} />
          <Button full type="submit" className="mt-2">Publish listing</Button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function MyListings() {
  const [params, setParams] = useSearchParams()
  const [showAdd, setShowAdd] = useState(params.get('add') === '1')
  const { listings, setListingStatus, removeListing, fetchListings } = useStore()

  useEffect(() => { fetchListings() }, [])

  const closeModal = () => { setShowAdd(false); params.delete('add'); setParams(params) }

  const cycleStatus = (id) => {
    const l = listings.find((x) => x.id === id)
    setListingStatus(id, l.status === 'active' ? 'paused' : 'active')
  }

  return (
    <PageShell wide>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-xl font-bold">My listings</h1>
        <Button icon={Plus} onClick={() => setShowAdd(true)}>Add crop</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {listings.map((l) => (
          <Card key={l.id} className="p-4 flex gap-3" hover>
            <div className="w-16 h-16 rounded-xl bg-growth-pale flex items-center justify-center text-3xl shrink-0">{l.image}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{l.crop}</p>
                  <p className="text-xs text-ink-faint">{l.quantity} {l.unit} · {l.location}</p>
                </div>
                <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0 capitalize ${STATUS_STYLE[l.status]}`}>{l.status}</span>
              </div>
              <p className="font-display font-bold text-forest mt-1">₹{l.price}/{l.unit}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-ink-faint">
                <span className="flex items-center gap-1"><Eye size={13} /> {l.views}</span>
                <span className="flex items-center gap-1"><Users size={13} /> {l.interest} interested</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-1 text-xs font-medium text-forest min-h-[36px] px-2"><Pencil size={13} /> Edit</button>
                <button onClick={() => cycleStatus(l.id)} className="flex items-center gap-1 text-xs font-medium text-ink-soft min-h-[36px] px-2">
                  {l.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                </button>
                <button onClick={() => removeListing(l.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 min-h-[36px] px-2"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>{showAdd && <AddListingModal onClose={closeModal} />}</AnimatePresence>
    </PageShell>
  )
}
