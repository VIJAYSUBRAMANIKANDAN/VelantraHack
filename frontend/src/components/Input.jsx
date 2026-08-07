export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-soft mb-1.5">{label}</span>}
      <input
        className={`w-full min-h-[44px] rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px]
          placeholder:text-ink-faint focus:border-forest transition-colors ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-red-500 mt-1">{error}</span>}
    </label>
  )
}
