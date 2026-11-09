import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'
import usePromptStore from '../../store/promptStore'
import { canInstallNative, isInstalled, isIOSSafari, onInstallChange, promptInstall } from '../../utils/install'

const KEY = 'ke_install_dismissed'
const DAYS = 14

// Banner offering to install the site as an app (Android/desktop: one tap; iPhone: shows the Add-to-Home-Screen steps).
export default function InstallPrompt() {
  const { active, claim, release } = usePromptStore()
  const [available, setAvailable] = useState(canInstallNative())
  const [ready, setReady] = useState(false)
  const [show, setShow] = useState(false)
  const ios = isIOSSafari()

  useEffect(() => onInstallChange(() => setAvailable(canInstallNative())), [])

  useEffect(() => {
    if (isInstalled()) return
    if (!available && !ios) return
    if (Date.now() - parseInt(localStorage.getItem(KEY) || '0') < DAYS * 86400000) return
    const t = setTimeout(() => setReady(true), 12000)
    return () => clearTimeout(t)
  }, [available, ios])

  useEffect(() => {
    if (ready && !show && claim('install')) setShow(true)
  }, [ready, active])

  const close = () => { localStorage.setItem(KEY, String(Date.now())); setShow(false); release('install') }

  const install = async () => {
    const r = await promptInstall()
    if (r !== 'unavailable') { setShow(false); release('install') }
  }

  if (!show || isInstalled()) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-dark-800 border border-dark-600 rounded-2xl shadow-xl p-4 flex items-start gap-3">
      <img src="/logo-mark.png" alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Install KenyanEscorts</p>
        {available ? (
          <>
            <p className="text-xs text-gray-400 mt-0.5">Add it to your home screen for faster access and message alerts.</p>
            <button onClick={install} className="btn-primary text-xs py-1.5 px-4 mt-2 inline-flex items-center gap-1.5"><Download size={13} /> Install app</button>
          </>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">Tap <Share size={12} className="inline -mt-0.5" /> <b>Share</b>, then <b>Add to Home Screen</b>.</p>
        )}
      </div>
      <button onClick={close} className="text-gray-500 hover:text-white" aria-label="Dismiss"><X size={16} /></button>
    </div>
  )
}
