import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

// Combines class strings and resolves conflicting Tailwind utilities
// (e.g. "bg-white" + "bg-forest") so the later/explicit one always wins.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
