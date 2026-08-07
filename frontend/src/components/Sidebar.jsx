import { NavLink } from 'react-router-dom'
import { Home, Package, ShoppingCart, Wallet, Sparkles, Users, Bell, HelpCircle, LogOut } from 'lucide-react'
import Logo from './Logo'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { useT } from '../lib/i18n'

const ITEM_DEFS = [
  { to: '/dashboard', icon: Home, key: 'nav_home' },
  { to: '/listings', icon: Package, key: 'nav_listings', countKey: 'listings' },
  { to: '/orders', icon: ShoppingCart, key: 'nav_orders' },
  { to: '/wallet', icon: Wallet, key: 'nav_wallet' },
  { to: '/dashboard', icon: Sparkles, key: 'nav_insights' },
  { to: '/requests', icon: Users, key: 'nav_requests' },
  { to: '/notifications', icon: Bell, key: 'nav_notifications' },
  { to: '/help', icon: HelpCircle, key: 'nav_support' },
]

// Persistent left sidebar shown from md breakpoint up, matching the
// dashboard reference. Hidden on mobile — BottomNav takes over there.
export default function Sidebar() {
  const { listings, logout } = useStore()
  const nav = useNavigate()
  const t = useT()
  const ITEMS = ITEM_DEFS.map((i) => ({ ...i, label: t(i.key) }))

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-forest-dark text-white min-h-screen sticky top-0">
      <div className="px-5 pt-6 pb-8">
        <Logo size={30} dark />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors
               ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            <span className="flex items-center gap-3">
              <item.icon size={17} strokeWidth={2.25} />
              {item.label}
            </span>
            {item.countKey === 'listings' && listings.length > 0 && (
              <span className="text-xs bg-sun text-forest-dark font-bold rounded-full px-2 py-0.5">{listings.length}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-6">
        <button
          onClick={() => { logout(); nav('/') }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} /> {t('nav_logout')}
        </button>
      </div>
    </aside>
  )
}
