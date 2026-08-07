import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -3, boxShadow: '0 8px 28px -6px rgba(27,94,58,0.18)' } : {}}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('bg-white rounded-xl2 shadow-card border border-black/5', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
