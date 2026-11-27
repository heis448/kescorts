import { Gift, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import ShareButton from './ShareButton'
import { SITE } from '../../utils/site'

// "Invite friends" card: the user's own link (…/register?ref=CODE), shared through the phone's share menu.
export default function InviteCard() {
  const { user } = useAuthStore()
  const code = user?.referral_code
  if (!code) return null
  const link = `${SITE}/register?ref=${code}`
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast.success('Link copied') } catch { toast.error('Could not copy') } }

  return (
    <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-3" data-testid="invite-card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0"><Gift size={20} className="text-brand-400" /></div>
        <div>
          <p className="font-semibold text-white">Invite friends</p>
          <p className="text-xs text-gray-400 mt-0.5">Earn bonus stars when a friend joins with your link.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <ShareButton title="Join me on RedRoom254" text="Join me on RedRoom254" url={link} label="Share my link"
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl py-2.5 active:scale-95 transition" />
        <button onClick={copy} aria-label="Copy link" className="px-3 rounded-xl bg-dark-800 border border-dark-600 text-gray-300 active:scale-95 transition"><Copy size={16} /></button>
      </div>
    </div>
  )
}
