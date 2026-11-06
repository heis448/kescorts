import { useEffect, useRef, useState } from 'react'
import { Rocket, Loader2, Wallet, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { reportError } from '../../utils/reportError'

const fmtLeft = (until) => {
  const ms = new Date(until) - Date.now()
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function BoostTab() {
  const { user, fetchMe } = useAuthStore()
  const [info, setInfo]   = useState(null)
  const [phone, setPhone] = useState(user?.phone || '')
  const [busy, setBusy]   = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [, tick] = useState(0)
  const pollRef = useRef(null)

  const load = () => api.get('/boost/status').then(r => setInfo(r.data)).catch(e => reportError(e, 'Could not load boost info'))

  useEffect(() => {
    load()
    const t = setInterval(() => tick(n => n + 1), 30000)   // keep the countdown fresh
    return () => { clearInterval(t); clearInterval(pollRef.current) }
  }, [])

  const left = info?.boosted_until ? fmtLeft(info.boosted_until) : null

  const done = (msg) => { toast.success(msg); load(); fetchMe?.() }

  const payWallet = async () => {
    setBusy(true)
    try {
      await api.post('/boost/buy', { method: 'wallet' })
      done('🚀 Boost active!')
    } catch (e) { toast.error(e.response?.data?.error || 'Could not boost') }
    setBusy(false)
  }

  const payMpesa = async () => {
    if (!phone) return toast.error('Enter your M-Pesa number')
    setBusy(true)
    try {
      const { data } = await api.post('/boost/buy', { method: 'mpesa', phone })
      toast.success('Enter your M-Pesa PIN on your phone')
      setWaiting(true)
      let tries = 0
      pollRef.current = setInterval(async () => {
        tries++
        try {
          const r = await api.post('/boost/verify', { checkoutRequestId: data.checkout_request_id })
          if (r.data.status === 'completed') { clearInterval(pollRef.current); setWaiting(false); setBusy(false); done('🚀 Boost active!') }
          else if (r.data.status !== 'pending') { clearInterval(pollRef.current); setWaiting(false); setBusy(false); toast.error('Payment was not completed') }
        } catch {}
        if (tries >= 30) { clearInterval(pollRef.current); setWaiting(false); setBusy(false); toast('Still waiting — your boost will activate automatically once paid.') }
      }, 4000)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not send M-Pesa prompt')
      setBusy(false)
    }
  }

  if (!info) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Rocket size={20} className="text-orange-400" /> Boost Your Listing</h2>
        <p className="text-sm text-gray-400">Get a 🔥 Boosted badge and jump ahead of Prime and Regular listings for {info.hours} hours. Top-tier profiles stay above boosts. Buy again to add more time.</p>
      </div>

      {left && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
          <p className="text-orange-300 font-semibold">🔥 Your profile is boosted</p>
          <p className="text-sm text-gray-300 mt-0.5">Time left: <b>{left}</b></p>
        </div>
      )}

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{info.hours}-hour boost</p>
            <p className="text-xs text-gray-500">Ahead of Prime and Regular listings</p>
          </div>
          <p className="font-mono font-bold text-white text-lg">KSh {info.price_kes}</p>
        </div>

        <button onClick={payWallet} disabled={busy || info.wallet_available < info.price_kes}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
          <Wallet size={16} /> Pay from wallet <span className="opacity-70 text-xs">(KSh {Number(info.wallet_available).toLocaleString()})</span>
        </button>

        <div className="space-y-2">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="M-Pesa number e.g. 0712345678"
            className="input w-full" inputMode="tel" />
          <button onClick={payMpesa} disabled={busy}
            className="btn-ghost w-full flex items-center justify-center gap-2 border border-dark-600">
            {waiting ? <><Loader2 size={16} className="animate-spin" /> Waiting for payment…</> : <><Smartphone size={16} /> Pay with M-Pesa</>}
          </button>
        </div>
      </div>
    </div>
  )
}
