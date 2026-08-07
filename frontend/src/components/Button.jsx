import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

const variants = {
  primary: 'bg-forest text-white hover:bg-forest-dark',
  gold: 'bg-sun text-forest-dark hover:bg-sun-dark',
  outline: 'bg-transparent border-2 border-forest text-forest hover:bg-growth-pale',
  ghost: 'bg-transparent text-ink-soft hover:bg-black/5',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
}

export default function Button({
  children, variant = 'primary', className = '', icon: Icon, full = false, ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold text-[15px] min-h-[44px] transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        full && 'w-full',
        className
      )}
      {...props}
    >
      {Icon && <Icon size={18} strokeWidth={2.25} />}
      {children}
    </motion.button>
  )
}
