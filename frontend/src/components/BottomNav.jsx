import { NavLink } from 'react-router-dom'
import { Home, Mic, Package, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useT } from '../lib/i18n'

const ITEM_DEFS = [
  { to: '/dashboard', icon: Home, key: 'nav_home' },
  { to: '/listings', icon: Package, key: 'nav_listings' },
  { to: '/voice', icon: Mic, key: 'nav_speak', hero: true },
  { to: '/profile', icon: User, key: 'nav_home' },
]

export default function BottomNav() {
  const t = useT()
  const items = ITEM_DEFS.map((i) => ({ ...i, label: i.key === 'nav_home' && i.to === '/profile' ? 'Profile' : t(i.key) }))
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t border-black/5
                 px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto sm:max-w-lg md:max-w-2xl lg:max-w-4xl flex items-center justify-between py-2">
        {items.map(({ to, icon: Icon, label, hero }) => (
          <NavLink key={to} to={to} className="flex-1 flex justify-center">
            {({ isActive }) =>
              hero ? (
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="relative -mt-7 flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-forest shadow-soft flex items-center justify-center">
                    <Icon size={24} color="white" strokeWidth={2.25} />
                  </div>
                  <span className="text-[11px] mt-1 font-medium text-forest">{label}</span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-1.5 min-w-[44px]">
                  <Icon size={22} strokeWidth={2.25} className={isActive ? 'text-forest' : 'text-ink-faint'} />
                  <span className={`text-[11px] font-medium ${isActive ? 'text-forest' : 'text-ink-faint'}`}>{label}</span>
                </div>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
