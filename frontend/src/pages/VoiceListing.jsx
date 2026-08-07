import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Keyboard, AlertCircle } from 'lucide-react'
import MicButton from '../components/MicButton'
import Button from '../components/Button'
import { useStore } from '../store/useStore'
import { useT } from '../lib/i18n'

// Free path: the browser's built-in SpeechRecognition (Web Speech API) —
// no API key, no backend call, works fully offline of any server cost.
// Chrome/Edge/Safari support it; Firefox does not (see `supported` below).
// Swap this for backend/app/routers/voice.py's Whisper call later if you
// want higher accuracy on Tamil/Telugu/Marathi or want it backend-driven.
const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

const LANG_CODES = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN', mr: 'mr-IN' }
const LANG_OPTIONS = [
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'en', label: 'English' },
]

// Unit / connector words across the languages the app supports (see LANG_OPTIONS).
// Speech recognition transcribes numbers as plain digits even for Indic
// languages, but the surrounding words (unit, "per kg", "in <place>") come
// back in the local script — so those need per-language matches, and any
// word-matching (crop, location) must use Unicode-aware \p{L}, not [a-zA-Z].
const UNIT_WORDS = 'kg|kgs|kilo|கிலோ|కిలో|किलो|केजी|కేజీ|கே\\.?ஜி'
const PER_KG_WORDS = '(?:per\\s?kg|\\/\\s?kg|ஒரு\\s?கிலோவுக்கு|கிலோவுக்கு|ప్రతి\\s?కిలో|కిలోకి|प्रति\\s?किलो|किलो\\s?के\\s?लिए)'
// NOTE: \b only recognizes ASCII word characters, so it silently fails to
// match a boundary in front of non-Latin words (Tamil/Telugu/Hindi) —
// this is why location parsing used to always fall back to the default.
// Use a start-of-string-or-whitespace lookbehind instead, which works for
// any script, and include the more common "location keyword" words
// (இடம், స్థలం, स्थान) alongside the "in/at" connector words.
const IN_WORDS = '(?:^|(?<=\\s))(?:in|at|இல்|இருந்து|இடம்|இடத்தில்|లో|దగ్గర|స్థలం|में|स्थान|मध्ये)\\s*'

function extractEntities(text) {
  const qtyMatch = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${UNIT_WORDS})`, 'iu'))
  const priceMatch = text.match(new RegExp(`(?:₹|rs\\.?|rupees?)?\\s*(\\d+(?:\\.\\d+)?)\\s*${PER_KG_WORDS}`, 'iu'))
  const locMatch = text.match(new RegExp(`${IN_WORDS}([\\p{L}\\p{M}]+)`, 'iu'))

  // Crop name: the first run of letters right after the qty+unit match,
  // skipping over the unit word itself. Works for any script (\p{L}).
  let crop = null
  if (qtyMatch) {
    const after = text.slice(qtyMatch.index + qtyMatch[0].length)
    const cropMatch = after.match(/[\p{L}\p{M}]+/u)
    if (cropMatch) crop = cropMatch[0]
  }

  return {
    crop: crop ? crop[0].toUpperCase() + crop.slice(1) : 'Tomatoes',
    quantity: qtyMatch ? Number(qtyMatch[1]) : 500,
    unit: 'kg',
    location: locMatch ? locMatch[1] : 'Salem',
    price: priceMatch ? Number(priceMatch[1]) : 25,
  }
}

export default function VoiceListing() {
  const nav = useNavigate()
  const { setDraftListing: setDraft, language, setLanguage } = useStore()
  const t = useT()
  const [stage, setStage] = useState('idle') // idle | listening | transcript | error
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [supported, setSupported] = useState(!!SpeechRecognitionAPI)

  const recognitionRef = useRef(null)
  const stageRef = useRef('idle')
  const setStageTracked = (next) => {
    stageRef.current = typeof next === 'function' ? next(stageRef.current) : next
    setStage(next)
  }

  useEffect(() => {
    return () => { try { recognitionRef.current?.stop() } catch { /* already stopped */ } }
  }, [])

  const startListening = () => {
    if (!SpeechRecognitionAPI) { setSupported(false); return }
    setErrorMsg('')
    setInterim('')

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = LANG_CODES[language] || 'en-IN'
    recognition.continuous = false      // auto-stops when you pause speaking
    recognition.interimResults = true   // shows live partial text while you talk
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += chunk
        else interimText += chunk
      }
      if (interimText) setInterim(interimText)
      if (finalText) {
        setTranscript(finalText.trim())
        setDraft(extractEntities(finalText))
        setStageTracked('transcript')
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setErrorMsg(t('mic_permission_denied'))
      } else if (event.error === 'no-speech') {
        setErrorMsg(t('no_speech_error'))
      } else {
        setErrorMsg(t('generic_speech_error'))
      }
      setStageTracked('error')
    }

    recognition.onend = () => {
      // If it ended without ever firing a final result (e.g. silence
      // the whole time), fall back to an error rather than hanging.
      // Uses a ref (not the `stage` closure) since this callback fires
      // asynchronously and needs the *current* stage, not the one at
      // the moment recognition.start() was called.
      if (stageRef.current === 'listening') {
        setErrorMsg(t('no_speech_end_error'))
        setStageTracked('error')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setStageTracked('listening')
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  const toggleListening = () => {
    if (stage === 'idle' || stage === 'error') startListening()
    else if (stage === 'listening') stopListening()
  }

  const confirm = () => nav('/voice/confirm')

  const skipToTyping = () => {
    setDraft({ crop: '', quantity: '', unit: 'kg', location: '', price: '' })
    nav('/voice/confirm')
  }

  // Keep the "Try again" button (sets plain `stage`) consistent with the ref.
  const resetToIdle = () => setStageTracked('idle')

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-5 pt-6 flex items-center gap-3 max-w-lg mx-auto w-full">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">{t('voice_page_title')}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        {!supported && (
          <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{t('browser_not_supported')}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage !== 'transcript' ? (
            <motion.div key="mic" exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center">
              <MicButton listening={stage === 'listening'} onToggle={toggleListening} />

              {stage === 'listening' && interim && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-ink-soft italic max-w-xs">
                  "{interim}"
                </motion.p>
              )}

              <motion.p
                key={stage}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 text-center font-display text-lg font-semibold text-ink"
              >
                {stage === 'idle' && t('mic_tap_to_speak')}
                {stage === 'listening' && <span className="text-forest">{t('listening_speak_now')}</span>}
                {stage === 'error' && <span className="text-red-500 text-base font-medium">{errorMsg}</span>}
              </motion.p>

              {stage === 'listening' && (
                <p className="text-center text-ink-faint text-xs mt-1">{t('stop_auto_hint')}</p>
              )}
              {stage !== 'error' && stage !== 'listening' && (
                <p className="text-center text-ink-soft text-sm mt-2 max-w-xs italic">
                  {t('voice_example_hint')}
                </p>
              )}
              {stage === 'idle' && language !== 'en' && (
                <p className="text-center text-sun-dark text-xs mt-2 max-w-xs">
                  {t('lang_accuracy_hint')}
                </p>
              )}

              <p className="text-center text-ink-faint text-xs mt-4 mb-2">{t('speaking_in')}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {LANG_OPTIONS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    disabled={stage === 'listening'}
                    onClick={() => setLanguage(l.code)}
                    className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors min-h-[36px] disabled:opacity-50
                      ${language === l.code
                        ? 'bg-forest text-white border-forest'
                        : 'bg-white text-ink-soft border-black/10 hover:border-forest hover:text-forest'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="bg-white rounded-xl2 shadow-card p-5 mb-4">
                <p className="text-xs text-ink-faint mb-2">{t('we_heard')}</p>
                <p className="font-display text-lg text-ink leading-relaxed">"{transcript}"</p>
              </div>
              <Button full onClick={confirm}>{t('looks_right_continue')}</Button>
              <Button full variant="ghost" className="mt-2" onClick={resetToIdle}>{t('try_again')}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {(stage === 'idle' || stage === 'error') && (
        <button className="mb-10 mx-auto flex items-center gap-2 text-sm text-ink-soft min-h-[44px]" onClick={skipToTyping}>
          <Keyboard size={16} /> {t('type_it_instead')}
        </button>
      )}
    </div>
  )
}
