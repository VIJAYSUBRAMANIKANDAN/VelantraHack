import { motion } from 'framer-motion'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

// Consistent page wrapper. On mobile: single column + bottom nav.
// From md breakpoint up: persistent left Sidebar + wider content area,
// matching the desktop dashboard reference.
export default function PageShell({ children, nav = true, className = '', wide = false }) {
  return (
    <div className="min-h-screen bg-cream flex">
      {nav && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`flex-1 w-full mx-auto px-4 pt-5 ${nav ? 'pb-24 md:pb-8' : 'pb-8'}
            ${wide ? 'max-w-none md:px-8' : 'max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl'} ${className}`}
        >
          {children}
        </motion.main>
        {nav && <BottomNav />}
      </div>
    </div>
  )
}
