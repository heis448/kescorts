import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import usePromptStore from '../../store/promptStore'
import { isPushSupported, isIOS, isStandalone, enablePush, getExistingSubscription, syncSubscription } from '../../utils/push'

const DISMISS_KEY = 'ke_notify_dismissed'
const DISMISS_DAYS = 7

// Small bottom banner asking logged-in users to turn on message notifications.
export default function NotifyPrompt() {
  const { user } = useAuthStore()
  const { active, claim, release } = usePromptStore()
  const [ready, setReady] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const needsInstall = isIOS() && !isStandalone() // iPhone only supports push for installed web apps

  useEffect(() => {
    if (!user) { setShow(false); setReady(false); release('notify'); return }
    let cancelled = false
    ;(async () => {
      if (!isPushSupported() && !needsInstall) return
      if (isPushSupported() && Notification.permission === 'denied') return
      if (isPushSupported() && (await getExistingSubscription())) { syncSubscription(); return }
      const t = parseInt(localStorage.getItem(DISMISS_KEY) || '0')
      if (Date.now() - t < DISMISS_DAYS * 86400000) return
      setTimeout(() => { if (!cancelled) setReady(true) }, 8000)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => {
    if (ready && !show && claim('notify')) setShow(true)
  }, [ready, active])

  const dismiss = () => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setShow(false); release('notify') }

  const turnOn = async () => {
    setBusy(true)
    try {
      const r = await enablePush()
      if (r === 'granted') { toast.success('Notifications on 🔔'); setShow(false); release('notify') }
      else if (r === 'denied') { toast.error('Notifications are blocked in your browser settings'); dismiss() }
      else if (r === 'unavailable') toast.error('Notifications are not available yet')
      else toast.error('Your browser does not support notifications')
    } catch { toast.error('Could not turn on notifications') }
    setBusy(false)
  }

  if (!show) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-dark-800 border border-dark-600 rounded-2xl shadow-xl p-4 flex items-start gap-3">
      <Bell size={20} className="text-brand-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Never miss a message</p>
        {needsInstall ? (
          <p className="text-xs text-gray-400 mt-0.5">On iPhone: tap the Share button, choose <b>Add to Home Screen</b>, then open the app from your home screen to turn on notifications.</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mt-0.5">Get an alert on your phone when someone messages you, even when the site is closed.</p>
            <button onClick={turnOn} disabled={busy} className="btn-primary text-xs py-1.5 px-4 mt-2">
              {busy ? 'Please wait…' : 'Turn on notifications'}
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} className="text-gray-500 hover:text-white" aria-label="Dismiss"><X size={16} /></button>
    </div>
  )
}
