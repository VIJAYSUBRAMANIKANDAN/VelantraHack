import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, Lock, Mic } from 'lucide-react'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Input from '../components/Input'
import { useStore } from '../store/useStore'

export default function Login() {
  const nav = useNavigate()
  const login = useStore((s) => s.login)
  const [mode, setMode] = useState('password') // 'password' | 'otp'
  const [phone, setPhone] = useState('')
  const [secret, setSecret] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    await login({ name: 'Farmer', phone, password: secret, village: 'Salem' })
    nav('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10">
      <div className="max-w-sm mx-auto w-full">
        <div className="flex justify-center mb-8"><Logo size={44} /></div>

        <motion.form
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          onSubmit={submit} className="space-y-4"
        >
          <h2 className="font-display text-2xl font-bold text-ink text-center mb-1">Welcome back</h2>
          <p className="text-center text-ink-soft text-sm mb-4">Log in to manage your listings</p>

          <Input label="Mobile number" type="tel" placeholder="98765 43210" icon={Phone}
                 value={phone} onChange={(e) => setPhone(e.target.value)} required />

          {mode === 'password' ? (
            <Input label="Password" type="password" placeholder="••••••••"
                   value={secret} onChange={(e) => setSecret(e.target.value)} required />
          ) : (
            <Input label="OTP" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                   value={secret} onChange={(e) => setSecret(e.target.value)} required />
          )}

          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => setMode(mode === 'password' ? 'otp' : 'password')} className="text-forest font-medium min-h-[44px]">
              {mode === 'password' ? 'Use OTP instead' : 'Use password instead'}
            </button>
            <Link to="#" className="text-ink-faint min-h-[44px] flex items-center">Forgot password?</Link>
          </div>

          <Button full type="submit">Log in</Button>

          <button type="button" disabled
            className="w-full flex items-center justify-center gap-2 text-ink-faint text-sm py-3 min-h-[44px] border border-dashed border-black/15 rounded-2xl opacity-60">
            <Mic size={16} /> Voice login (coming soon)
          </button>

          <p className="text-center text-sm text-ink-soft pt-2">
            New here? <Link to="/register" className="text-forest font-semibold">Create an account</Link>
          </p>
        </motion.form>
      </div>
    </div>
  )
}
