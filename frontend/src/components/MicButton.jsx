import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square } from 'lucide-react'

// Signature interaction: while listening, three concentric rings expand
// outward like sun-rays / growth rings — echoing the logo's mark instead
// of a generic audio waveform.
export default function MicButton({ listening, onToggle, size = 128 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 1.8, height: size * 1.8 }}>
      <AnimatePresence>
        {listening &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.6, opacity: 0.5 }}
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              className="absolute rounded-full border-2 border-sun"
              style={{ width: size, height: size }}
            />
          ))}
      </AnimatePresence>

      <motion.button
        onClick={onToggle}
        aria-pressed={listening}
        aria-label={listening ? 'Stop recording' : 'Start voice listing'}
        whileTap={{ scale: 0.94 }}
        animate={listening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={listening ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 300 }}
        className={`relative rounded-full flex items-center justify-center shadow-soft
          ${listening ? 'bg-sun' : 'bg-forest'} transition-colors duration-300`}
        style={{ width: size, height: size }}
      >
        {listening ? (
          <Square size={size * 0.32} color="#123D26" strokeWidth={2} fill="#123D26" />
        ) : (
          <Mic size={size * 0.4} color="white" strokeWidth={2} />
        )}
      </motion.button>
    </div>
  )
}
