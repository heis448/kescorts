import { useEffect, useState } from 'react'
import { BellRing, Download, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { isPushSupported, isIOS, isStandalone, enablePush, getExistingSubscription } from '../../utils/push'
import { canInstallNative, isInstalled, onInstallChange, promptInstall } from '../../utils/install'

// Sits at the top of the notifications menu: shows whether phone alerts work, lets the user turn them on / test them / install the app.
export default function AppAlertsRow() {
  const [state, setState] = useState('loading')   // loading | unsupported | needs-install | denied | off | on
  const [busy, setBusy] = useState(false)
  const [canInstall, setCanInstall] = useState(canInstallNative())

  useEffect(() => onInstallChange(() => setCanInstall(canInstallNative())), [])

  useEffect(() => {
    (async () => {
      if (!isPushSupported()) return setState(isIOS() && !isStandalone() ? 'needs-install' : 'unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      const sub = await getExistingSubscription()
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off')
    })()
  }, [])

  const turnOn = async () => {
    setBusy(true)
    try {
      const r = await enablePush()
      if (r === 'granted') { setState('on'); toast.success('Phone alerts on 🔔') }
      else if (r === 'denied') { setState('denied'); toast.error('Blocked — allow notifications in your browser settings') }
      else if (r === 'unavailable') toast.error('Alerts are not set up on the server yet')
      else toast.error('This browser does not support alerts')
    } catch { toast.error('Could not turn on alerts') }
    setBusy(false)
  }

  const test = async () => {
    setBusy(true)
    try { const { data } = await api.post('/push/test'); toast.success(`Test sent to ${data.sent} device${data.sent > 1 ? 's' : ''}`) }
    catch (e) { toast.error(e.response?.data?.error || 'Test failed') }
    setBusy(false)
  }

  const install = async () => { await promptInstall() }

  const line = {
    loading: null,
    unsupported: 'Phone alerts are not supported in this browser.',
    'needs-install': 'On iPhone: Share → Add to Home Screen, then open the app to turn on alerts.',
    denied: 'Alerts are blocked. Allow notifications for this site in your browser settings.',
    off: 'Get an alert on your phone for new messages.',
    on: 'Phone alerts are on ✓',
  }[state]

  if (state === 'loading') return null
  return (
    <div className="px-4 py-3 border-b border-dark-700 bg-dark-900/40 space-y-2">
      <p className="text-xs text-gray-400 flex items-start gap-2"><BellRing size={14} className="mt-0.5 flex-shrink-0 text-brand-400" />{line}</p>
      <div className="flex flex-wrap gap-2">
        {state === 'off' && <button onClick={turnOn} disabled={busy} className="btn-primary text-xs py-1 px-3">Turn on</button>}
        {state === 'on' && <button onClick={test} disabled={busy} className="btn-ghost text-xs py-1 px-3 border border-dark-600 inline-flex items-center gap-1"><Send size={12} /> Send test</button>}
        {canInstall && !isInstalled() && <button onClick={install} className="btn-ghost text-xs py-1 px-3 border border-dark-600 inline-flex items-center gap-1"><Download size={12} /> Install app</button>}
      </div>
    </div>
  )
}
