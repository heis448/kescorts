import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import api from '../utils/api'
import Seo from '../components/Seo'

const Stat = ({ icon, label, value, hint }) => (
  <div className="bg-dark-800 border border-dark-600 rounded-2xl p-4">
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-300 mt-0.5">{icon} {label}</p>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
)

// Private report for a sponsor — opened with the secret link the admin sends them (no account needed)
export default function SponsorStats({ kind = 'sponsored' }) {
  const { token } = useParams()
  const isAd = kind === 'ads'
  const [data, setData]   = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get(`/admin/${kind}/stats/${token}`).then(r => setData(r.data)).catch(() => setError(true))
  }, [token])

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Seo title={`${isAd ? 'Advertiser' : 'Sponsor'} report · RedRoom254`} noindex path={`/${isAd ? 'ad' : 'sponsor'}-stats/${token}`} />
      {error ? (
        <p className="text-center text-gray-400">This report link is not valid.</p>
      ) : !data ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-500" /></div>
      ) : (
        <>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">{isAd ? 'Advertiser report' : 'Sponsor report'}</p>
          <h1 className="text-2xl font-display font-bold text-white mt-1">{data.name}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Running since {new Date(data.created_at).toLocaleDateString()} · {data.is_active ? 'Active' : 'Paused'}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Stat icon="👁" label="Views" value={data.impressions.toLocaleString()} hint="Times your ad appeared on screen" />
            <Stat icon="🖱" label="Clicks" value={data.clicks.toLocaleString()} hint={isAd ? 'People who tapped your ad' : 'Calls, WhatsApp chats and link taps'} />
            <Stat icon="📈" label="Click rate" value={`${data.ctr}%`} hint="Clicks ÷ views" />
            {!isAd && <Stat icon="🔍" label="Photo opens" value={data.opens.toLocaleString()} hint="Photos viewed full-screen" />}
            {!isAd && <Stat icon="📞" label="Calls" value={data.call_clicks.toLocaleString()} />}
            {!isAd && <Stat icon="💬" label="WhatsApp" value={data.wa_clicks.toLocaleString()} />}
          </div>
          <p className="text-xs text-gray-600 mt-6 text-center">Figures update as people see and tap your ad.</p>
        </>
      )}
    </div>
  )
}
