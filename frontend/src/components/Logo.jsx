import logo from '../assets/logo.png'

export default function Logo({ size = 40, showWordmark = true, dark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="Velantra" style={{ height: size, width: 'auto' }} className="object-contain" />
      {showWordmark && (
        <div className="leading-tight">
          <div className={`font-display font-bold tracking-tight ${dark ? 'text-white' : 'text-forest'}`} style={{ fontSize: size * 0.5 }}>
            Velantra
          </div>
        </div>
      )}
    </div>
  )
}
