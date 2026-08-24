import { useState, useEffect } from 'react'
import { Search, Ban, CheckCircle, UserCheck, UserX, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole]     = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = role ? `?role=${role}` : ''
    api.get(`/admin/users${params}`).then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [role])

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
                  {['User','Role','Status','Joined','Actions'].map(h => (
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
    </div>
  )
}
