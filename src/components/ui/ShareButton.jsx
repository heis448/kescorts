import { Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Opens the phone's own share menu (WhatsApp, Telegram, Messages…). Where that isn't available (most desktops)
// it copies the link instead.
export async function shareLink({ title, text, url }) {
  const link = url || window.location.href
  try {
    if (navigator.share) { await navigator.share({ title, text, url: link }); return 'shared' }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled' }   // user closed the menu
  try { await navigator.clipboard.writeText(link); toast.success('Link copied'); return 'copied' }
  catch { toast.error('Could not share. Copy the address from your browser instead.'); return 'failed' }
}

export default function ShareButton({ title, text, url, className = '', label = 'Share', iconOnly = false }) {
  return (
    <button type="button" onClick={() => shareLink({ title, text, url })} aria-label={label}
      className={className || 'inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-dark-800 border border-dark-600 rounded-xl px-3 py-2 active:scale-95 transition'}>
      <Share2 size={15} />{!iconOnly && label}
    </button>
  )
}
