import { useState, useEffect } from 'react'
import { Search, Ban, CheckCircle, UserCheck, UserX, Loader2, Crown, X } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole]     = useState('')
  const [search, setSearch] = useState('')
  const [tierUser, setTierUser] = useState(null)   // escort whose tier is being edited
  const [tiers, setTiers]       = useState([])
  const [tierId, setTierId]     = useState('')
  const [days, setDays]         = useState(30)
  const [busy, setBusy]         = useState(false)

  useEffect(() => {
    const params = role ? `?role=${role}` : ''
    api.get(`/admin/users${params}`).then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [role])

  const reload = () => {
    const params = role ? `?role=${role}` : ''
    return api.get(`/admin/users${params}`).then(r => setUsers(r.data))
  }

  const openTier = async (u) => {
    setTierUser(u)
    setDays(30)
    if (!tiers.length) {
      try { const { data } = await api.get('/admin/tiers'); setTiers(data); setTierId(String(data[0]?.id || '')) } catch { toast.error('Could not load tiers') }
    } else setTierId(String(tiers[0]?.id || ''))
  }

  const grantTier = async () => {
    if (!tierId) return toast.error('Choose a tier')
    setBusy(true)
    try {
      const { data } = await api.post(`/admin/users/${tierUser.id}/membership`, { tier_id: parseInt(tierId), duration_days: parseInt(days) })
      toast.success(`${data.tier} granted for ${days} days`)
      setTierUser(null)
      await reload()
    } catch (e) { toast.error(e.response?.data?.error || 'Could not grant tier') }
    setBusy(false)
  }

  const removeTier = async () => {
    if (!window.confirm(`Remove ${tierUser.name || tierUser.email}'s ${tierUser.tier_name} membership?`)) return
    setBusy(true)
    try {
      await api.delete(`/admin/users/${tierUser.id}/membership`)
      toast.success('Membership removed')
      setTierUser(null)
      await reload()
    } catch (e) { toast.error(e.response?.data?.error || 'Could not remove tier') }
    setBusy(false)
  }

  const ban = async (id, val) => {
    await api.put(`/admin/users/${id}/ban`, { ban: val })
    setUsers(u => u.map(x => x.id === id ? { ...x, is_banned: val } : x))
    toast.success(val ? 'User banned' : 'User unbanned')
  }

  const activate = async (id, val) => {
    await api.put(`/admin/users/${id}/activate`, { active: val })
    setUsers(u => u.map(x => x.id === id ? { ...x, is_active: val } : x))
    toast.success(val ? 'User activated' : 'User deactivated')
  }

  const verify = async (id, val) => {
    await api.put(`/admin/users/${id}/verify`, { verified: val })
    setUsers(u => u.map(x => x.id === id ? { ...x, is_verified: val } : x))
    toast.success(val ? 'User verified' : 'User unverified')
  }

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search) || u.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-8 py-2 text-sm" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-lg p-1">
          {['', 'escort', 'client', 'admin'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${role === r ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="text-brand-500 animate-spin" /></div>
      ) : (
        <div className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  {['User','Role','Tier','Status','Joined','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{u.name || u.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      <p className="text-xs text-gray-600">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                        u.role === 'admin'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        u.role === 'escort' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'escort' ? (
                        u.tier_name ? (
                          <div>
                            <p className="text-xs text-amber-300 font-medium">{u.tier_name}</p>
                            <p className="text-[11px] text-gray-500">until {format(new Date(u.tier_expires_at), 'dd MMM yyyy')}</p>
                          </div>
                        ) : <span className="text-xs text-gray-600">No tier</span>
                      ) : <span className="text-xs text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs ${u.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                          {u.is_active ? '● Active' : '○ Inactive'}
                        </span>
                        {u.is_banned && <span className="text-xs text-red-400">⊘ Banned</span>}
                        {u.is_verified && <span className="text-xs text-blue-400">✓ Verified</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {format(new Date(u.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => activate(u.id, !u.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-dark-600'}`}
                          title={u.is_active ? 'Deactivate' : 'Activate'}>
                          {u.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                        <button onClick={() => ban(u.id, !u.is_banned)}
                          className={`p-1.5 rounded-lg transition-colors ${u.is_banned ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:bg-dark-600'}`}
                          title={u.is_banned ? 'Unban' : 'Ban'}>
                          <Ban size={14} />
                        </button>
                        {u.role === 'escort' && (
                          <button onClick={() => openTier(u)}
                            className={`p-1.5 rounded-lg transition-colors ${u.tier_name ? 'text-amber-400 hover:bg-amber-500/10' : 'text-gray-500 hover:bg-dark-600'}`}
                            title="Grant or remove tier">
                            <Crown size={14} />
                          </button>
                        )}
                        {u.role === 'escort' && (
                          <button onClick={() => verify(u.id, !u.is_verified)}
                            className={`p-1.5 rounded-lg transition-colors ${u.is_verified ? 'text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:bg-dark-600'}`}
                            title={u.is_verified ? 'Remove verified badge' : 'Mark as verified'}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tierUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => !busy && setTierUser(null)}>
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2"><Crown size={16} className="text-amber-400" /> Membership</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tierUser.name || tierUser.email}</p>
              </div>
              <button onClick={() => setTierUser(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <p className="text-sm text-gray-300">
              Current: {tierUser.tier_name
                ? <b className="text-amber-300">{tierUser.tier_name} <span className="font-normal text-gray-500">(until {format(new Date(tierUser.tier_expires_at), 'dd MMM yyyy')})</span></b>
                : <span className="text-gray-500">no active tier</span>}
            </p>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Tier to grant</label>
              <select value={tierId} onChange={e => setTierId(e.target.value)} className="input w-full">
                {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="text-xs text-gray-400">For how many days</label>
              <div className="flex gap-2">
                {[7, 15, 30, 90].map(d => (
                  <button key={d} type="button" onClick={() => setDays(d)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border ${Number(days) === d ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-dark-600 text-gray-400'}`}>{d}d</button>
                ))}
                <input type="number" min="1" max="3650" value={days} onChange={e => setDays(e.target.value)} className="input w-20 text-center text-sm py-1.5" />
              </div>
              <p className="text-[11px] text-gray-500">Granting replaces any current tier. No payment is recorded (marked as an admin grant).</p>
            </div>

            <div className="flex gap-2">
              <button onClick={grantTier} disabled={busy} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Crown size={15} />} Grant tier
              </button>
              {tierUser.tier_name && (
                <button onClick={removeTier} disabled={busy} className="px-4 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm">Remove tier</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
