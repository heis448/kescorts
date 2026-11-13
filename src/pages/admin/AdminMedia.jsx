import { useEffect, useState } from 'react'
import { Loader2, Save, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { reportError } from '../../utils/reportError'

const QUALITY = [
  { id: 'high',     title: 'High quality (recommended)', desc: 'Photos up to 2400 px, videos up to 1080p. Looks the same to the eye; files are about 60–80% smaller than phone originals.' },
  { id: 'balanced', title: 'Balanced',                   desc: 'Photos up to 1600 px, videos up to 720p. Smallest files and fastest loading, with a small loss you may notice when zooming.' },
]
const STORAGE = [
  { id: 'auto',   title: 'Automatic (recommended)', desc: 'Upload to Catbox first. If Catbox fails, save on this server.' },
  { id: 'local',  title: 'This server only',        desc: 'Always save on your own server. Fastest and most reliable. Needs PUBLIC_URL and UPLOAD_DIR set on the server.' },
  { id: 'catbox', title: 'Catbox only',             desc: 'Never save on the server. Uploads fail if Catbox is down.' },
]

function Toggle({ on, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-brand-500' : 'bg-dark-600'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function Choice({ options, value, onChange, disabled }) {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
            value === o.id ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600 hover:border-dark-500'}`}>
          <p className="text-sm font-medium text-white">{o.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{o.desc}</p>
        </button>
      ))}
    </div>
  )
}

export default function AdminMedia() {
  const [s, setS] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/media-settings').then(r => setS(r.data)).catch(e => reportError(e, 'Could not load media settings'))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/admin/media-settings', s)
      setS(data)
      toast.success('Media settings saved')
    } catch (e) { toast.error(e.response?.data?.error || 'Could not save') }
    setSaving(false)
  }

  if (!s) return <div className="flex justify-center py-20"><Loader2 size={28} className="text-brand-500 animate-spin" /></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2"><ImageIcon size={22} /> Media</h1>
        <p className="text-gray-500 text-sm mt-1">Controls how photos and videos are compressed and where they are stored. Applies to new uploads only.</p>
      </div>

      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5 space-y-5">
        <div className="divide-y divide-dark-700">
          <Toggle on={s.compress_images} onChange={v => setS({ ...s, compress_images: v })}
            label="Compress photos" hint="Off = photos are stored exactly as uploaded (larger files, GPS data kept)." />
          <Toggle on={s.compress_video} onChange={v => setS({ ...s, compress_video: v })}
            label="Compress videos" hint="Needs ffmpeg installed on the server. Off = videos are stored as uploaded." />
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-2">Compression quality</p>
          <Choice options={QUALITY} value={s.quality} onChange={v => setS({ ...s, quality: v })}
            disabled={!s.compress_images && !s.compress_video} />
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-2">Where files are stored</p>
          <Choice options={STORAGE} value={s.storage} onChange={v => setS({ ...s, storage: v })} />
        </div>

        <button onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save settings
        </button>
        <p className="text-xs text-gray-500">Changes apply within a minute. Photos already uploaded are not changed.</p>
      </div>
    </div>
  )
}
