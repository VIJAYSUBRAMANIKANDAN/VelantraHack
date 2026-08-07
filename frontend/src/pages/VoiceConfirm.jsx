import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Input from '../components/Input'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { useT } from '../lib/i18n'

export default function VoiceConfirm() {
  const nav = useNavigate()
  const t = useT()
  const { draftListing, setDraftListing } = useStore()
  const [form, setForm] = useState(draftListing || { crop: 'Tomatoes', quantity: 500, unit: 'kg', location: 'Salem', price: 25, quality: 'Grade A', harvestDate: '' })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const confirm = () => {
    setDraftListing(form)
    nav('/voice/fair-price')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-5 pt-6 flex items-center gap-3 max-w-lg mx-auto w-full">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">{t('confirm_listing_title')}</h1>
      </header>

      <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex-1 max-w-lg mx-auto w-full px-5 pb-8 mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('field_crop')} value={form.crop} onChange={update('crop')} />
          <Input label={t('field_quality')} value={form.quality} onChange={update('quality')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('field_quantity_kg')} type="number" value={form.quantity} onChange={update('quantity')} />
          <Input label={t('field_expected_price')} type="number" value={form.price} onChange={update('price')} />
        </div>
        <Input label={t('field_location')} value={form.location} onChange={update('location')} />
        <Input label={t('field_harvest_date')} type="date" value={form.harvestDate} onChange={update('harvestDate')} />

        <div className="pt-2 space-y-2">
          <Button full onClick={confirm}>{t('confirm_listing_btn')}</Button>
          <Button full variant="outline" onClick={() => nav('/voice')}>{t('edit_by_voice_again')}</Button>
          <Button full variant="ghost" onClick={() => nav('/dashboard')}>{t('cancel')}</Button>
        </div>
      </motion.main>
    </div>
  )
}
