// Single source of truth for Kenyan phone numbers (frontend).
// Mirrors backend utils/phone.js — keep the two in sync.
//
//   toE164KE('0711 255 065') -> '254711255065'  (wa.me, M-Pesa)
//   waLink(phone, text)      -> 'https://wa.me/254711255065?text=...' | null
//   telLink(phone)           -> 'tel:+254711255065' | null
//   formatKE(phone)          -> '0711 255 065'  (display)
//
// Valid = Kenyan mobile: 254 + 9 digits starting with 7 or 1 (07XX… and 01XX…).

export const toE164KE = (input) => {
  const p = String(input ?? '').replace(/\D/g, '')
  if (/^254[71]\d{8}$/.test(p)) return p
  if (/^0[71]\d{8}$/.test(p))   return '254' + p.slice(1)
  if (/^[71]\d{8}$/.test(p))    return '254' + p
  return null
}

export const isValidKE = (input) => toE164KE(input) !== null

export const waLink = (input, text) => {
  const n = toE164KE(input)
  if (!n) return null
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const telLink = (input) => {
  const n = toE164KE(input)
  return n ? `tel:+${n}` : null
}

// '0711255065' -> '0711 255 065' (falls back to the raw value if invalid)
export const formatKE = (input) => {
  const n = toE164KE(input)
  if (!n) return String(input ?? '')
  const l = '0' + n.slice(3)
  return `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}`
}

// Safe variants for rendering links: use the E.164 form when the number is valid,
// otherwise fall back to the raw digits so a link is never worse than before.
export const waDigits = (input) => toE164KE(input) ?? String(input ?? '').replace(/\D/g, '')
export const telHref  = (input) => telLink(input) ?? `tel:${String(input ?? '').trim()}`
