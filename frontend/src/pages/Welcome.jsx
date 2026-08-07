import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { useT } from '../lib/i18n'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
]

export default function Welcome() {
  const nav = useNavigate()
  const { language, setLanguage, login } = useStore()
  const [showLang, setShowLang] = useState(false)
  const t = useT()

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest to-forest-dark flex flex-col items-center justify-between px-6 py-12 text-white overflow-hidden relative">
      {/* ambient growth rings, decorative */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.08 }}
        transition={{ duration: 1.5 }}
        className="absolute w-[120vw] h-[120vw] rounded-full border border-white -top-1/3 -right-1/3"
      />

      <div />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center text-center z-10"
      >
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <Logo size={64} showWordmark={false} />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Velantra</h1>
        <p className="text-white/80 mt-1 text-[15px]">{t('welcome_tagline')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="w-full max-w-sm z-10 space-y-3"
      >
        <Button full variant="gold" onClick={() => nav('/register')}>{t('create_account')}</Button>
        <Button full variant="outline" className="!text-white !border-white/60 hover:!bg-white/10" onClick={() => nav('/login')}>
          {t('log_in')}
        </Button>
        <button
          onClick={() => { login({ name: 'Guest' }); nav('/dashboard') }}
          className="w-full text-center text-white/70 text-sm py-2 underline-offset-4 hover:underline min-h-[44px]"
        >
          {t('continue_guest')}
        </button>

        <div className="pt-2">
          <button
            onClick={() => setShowLang((s) => !s)}
            className="w-full text-center text-sm text-white/70 py-2 min-h-[44px]"
          >
            {t('language_label')}: <span className="text-white font-medium">{LANGS.find(l => l.code === language)?.label}</span>
          </button>
          {showLang && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-3 gap-2 mt-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setShowLang(false) }}
                  className={`min-h-[44px] rounded-xl text-sm font-medium ${language === l.code ? 'bg-sun text-forest-dark' : 'bg-white/10 text-white'}`}
                >
                  {l.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
