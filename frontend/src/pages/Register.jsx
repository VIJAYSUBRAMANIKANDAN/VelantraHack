import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, Upload } from 'lucide-react'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Input from '../components/Input'
import { useStore } from '../store/useStore'

const STEPS = ['Personal', 'Farm', 'Bank', 'Identity']

export default function Register() {
  const nav = useNavigate()
  const register = useStore((s) => s.register)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({})

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish())
  const back = () => (step === 0 ? nav('/') : setStep(step - 1))
  const finish = async () => {
    await register({
      full_name: form.fullName || 'Farmer', phone: form.phone, email: form.email,
      password: form.password, village: form.village, district: form.district,
      state: form.state, pin_code: form.pin, farm_size: form.farmSize, main_crops: form.crops,
      bank_account: form.account, ifsc: form.ifsc, upi_id: form.upi, aadhaar_id: form.aadhaar,
    })
    nav('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-5 pt-6 pb-2 flex items-center gap-3 max-w-lg mx-auto w-full">
        <button onClick={back} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5">
          <ChevronLeft size={22} />
        </button>
        <Logo size={28} />
      </header>

      {/* Stepper */}
      <div className="max-w-lg mx-auto w-full px-5 mt-4 mb-2">
        <div className="flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{ backgroundColor: i <= step ? '#1B5E3A' : '#E7F2E5', color: i <= step ? '#fff' : '#8C978F' }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {i < step ? <Check size={16} /> : i + 1}
                </motion.div>
                <span className={`text-[11px] font-medium ${i <= step ? 'text-forest' : 'text-ink-faint'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mb-4 bg-growth-pale relative overflow-hidden">
                  <motion.div animate={{ width: i < step ? '100%' : '0%' }} className="absolute inset-y-0 left-0 bg-forest" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 mt-2"
          >
            {step === 0 && (
              <>
                <h2 className="font-display text-xl font-bold">Personal details</h2>
                <Input label="Full name" placeholder="e.g. Murugan K" value={form.fullName || ''} onChange={update('fullName')} />
                <Input label="Mobile number" type="tel" placeholder="98765 43210" value={form.phone || ''} onChange={update('phone')} />
                <div className="flex gap-2">
                  <Input className="flex-1" placeholder="Enter OTP" value={form.otp || ''} onChange={update('otp')} />
                  <Button variant="outline" type="button" className="whitespace-nowrap">Send OTP</Button>
                </div>
                <Input label="Email (optional)" type="email" placeholder="you@example.com" value={form.email || ''} onChange={update('email')} />
                <Input label="Password" type="password" placeholder="Create a password" value={form.password || ''} onChange={update('password')} />
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-display text-xl font-bold">Farm details</h2>
                <Input label="Village" placeholder="e.g. Ammapettai" value={form.village || ''} onChange={update('village')} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="District" placeholder="Salem" value={form.district || ''} onChange={update('district')} />
                  <Input label="State" placeholder="Tamil Nadu" value={form.state || ''} onChange={update('state')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="PIN code" placeholder="636001" value={form.pin || ''} onChange={update('pin')} />
                  <Input label="Farm size (acres)" type="number" placeholder="2.5" value={form.farmSize || ''} onChange={update('farmSize')} />
                </div>
                <Input label="Main crops" placeholder="Tomatoes, Onions, Turmeric" value={form.crops || ''} onChange={update('crops')} />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-xl font-bold">Bank details</h2>
                <Input label="Account number" value={form.account || ''} onChange={update('account')} />
                <Input label="IFSC code" value={form.ifsc || ''} onChange={update('ifsc')} />
                <Input label="UPI ID (optional)" placeholder="name@upi" value={form.upi || ''} onChange={update('upi')} />
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-xl font-bold">Identity verification</h2>
                <p className="text-sm text-ink-soft -mt-2">Required to receive payments through escrow.</p>
                {[
                  { key: 'aadhaar', label: 'Aadhaar card', required: true },
                  { key: 'farmerId', label: 'Farmer ID (optional)', required: false },
                  { key: 'selfie', label: 'Selfie verification (optional)', required: false },
                ].map((doc) => (
                  <button
                    key={doc.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, [doc.key]: true }))}
                    className={`w-full flex items-center justify-between rounded-xl border-2 border-dashed px-4 py-4 min-h-[44px]
                      ${form[doc.key] ? 'border-growth bg-growth-pale' : 'border-black/15 bg-white'}`}
                  >
                    <span className="text-sm font-medium">{doc.label}{doc.required && <span className="text-red-500"> *</span>}</span>
                    {form[doc.key] ? <Check size={18} className="text-growth" /> : <Upload size={18} className="text-ink-faint" />}
                  </button>
                ))}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          <Button full onClick={next}>{step === STEPS.length - 1 ? 'Finish registration' : 'Continue'}</Button>
        </div>
      </main>
    </div>
  )
}
