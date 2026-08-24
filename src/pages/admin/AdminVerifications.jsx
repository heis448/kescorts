import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminVerifications() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [notes, setNotes]   = useState({})

  useEffect(() => {
    setLoading(true)
    api.get(`/admin/verifications?status=${status}`).then(r => { setItems(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [status])

  const review = async (userId, action) => {
    try {
      await api.put(`/admin/verifications/${userId}`, { status: action, notes: notes[userId] || '' })
      setItems(i => i.filter(x => x.user_id !== userId))
      toast.success(`Verification ${action}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Verifications</h1>
          <p className="text-gray-500 text-sm mt-1">Review escort photo verification requests</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-xl p-1 w-fit mb-6">
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              status === s ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'
            }`}>{s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="text-brand-500 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p>No {status} verifications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(v => (
            <div key={v.user_id} className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
              {v.photo_url ? (
                <img src={v.photo_url} alt="Verification" className="w-full h-48 object-cover object-top" />
              ) : (
                <div className="w-full h-48 bg-dark-700 flex items-center justify-center text-gray-600 text-sm">No photo</div>
              )}
              <div className="p-4">
                <p className="font-semibold text-white">{v.full_name || v.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 mb-1">{v.email}</p>
                <p className="text-xs text-gray-500 mb-3">{v.phone} · Submitted {format(new Date(v.created_at), 'dd MMM yyyy')}</p>

                <div className="text-xs text-gray-400 space-y-1 mb-3 bg-dark-700/50 rounded-lg p-2.5">
                  {v.age && <p><span className="text-gray-500">Age:</span> {v.age}</p>}
                  {v.gender && <p><span className="text-gray-500">Gender:</span> {v.gender}</p>}
                  {(v.location || v.country) && <p><span className="text-gray-500">Location:</span> {[v.location, v.country].filter(Boolean).join(', ')}</p>}
                  {v.description && <p><span className="text-gray-500">Note:</span> {v.description}</p>}
                </div>

                {status === 'pending' && (
                  <>
                    <textarea
                      className="input text-xs py-2 resize-none mb-3"
                      placeholder="Notes (optional)..."
                      rows={2}
                      value={notes[v.user_id] || ''}
                      onChange={e => setNotes(n => ({...n,[v.user_id]:e.target.value}))}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => review(v.user_id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm transition-colors border border-green-500/20">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button onClick={() => review(v.user_id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors border border-red-500/20">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </>
                )}

                {status !== 'pending' && (
                  <div className={`flex items-center gap-1.5 text-sm ${status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                    {status === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span className="capitalize">{status}</span>
                    {v.notes && <span className="text-gray-500 text-xs ml-1">— {v.notes}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
