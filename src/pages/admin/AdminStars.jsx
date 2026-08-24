import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Plus, Settings, Banknote, Check, X,
  Loader2, Edit2, Trash2, TrendingUp, Users
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const TABS = ['Settings', 'Packages', 'Cashouts', 'Stats']

const EMPTY_PKG = { name: '', stars: '', bonus_stars: 0, price_kes: '', is_popular: false, is_active: true }

export default function AdminStars() {
  const [tab, setTab]             = useState('Settings')
  const [settings, setSettings]   = useState({})
  const [packages, setPackages]   = useState([])
  const [cashouts, setCashouts]   = useState([])
  const [stats, setStats]         = useState(null)
  const [cashoutFilter, setCashoutFilter] = useState('pending')
  const [modal, setModal]         = useState(null) // 'pkg' | 'reject'
  const [editing, setEditing]     = useState(null)
  const [pkgForm, setPkgForm]     = useState(EMPTY_PKG)
  const [rejectId, setRejectId]   = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [saving, setSaving]       = useState(false)

  const fetchAll = () => {
    api.get('/admin/stars/settings').then(r => setSettings(r.data)).catch(() => {})
    api.get('/admin/stars/packages').then(r => setPackages(r.data)).catch(() => {})
    api.get('/admin/stars/stats').then(r => setStats(r.data)).catch(() => {})
  }

  const fetchCashouts = () => {
    api.get(`/admin/stars/cashouts?status=${cashoutFilter}`).then(r => setCashouts(r.data)).catch(() => {})
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchCashouts() }, [cashoutFilter])

  // Save settings
  const saveSettings = async () => {
    setSaving(true)
    try {
      await api.put('/admin/stars/settings', settings)
      toast.success('Settings saved!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setSaving(false)
  }

  // Save package
  const savePkg = async () => {
    if (!pkgForm.name || !pkgForm.stars || !pkgForm.price_kes) return toast.error('Name, stars and price required')
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/admin/stars/packages/${editing.id}`, pkgForm)
        toast.success('Package updated!')
      } else {
        await api.post('/admin/stars/packages', pkgForm)
        toast.success('Package created!')
      }
      fetchAll()
      setModal(null)
      setEditing(null)
      setPkgForm(EMPTY_PKG)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setSaving(false)
  }

  const deletePkg = async (id) => {
    if (!confirm('Delete this package?')) return
    await api.delete(`/admin/stars/packages/${id}`)
    toast.success('Deleted')
    fetchAll()
  }

  const approveCashout = async (id) => {
    try {
      await api.put(`/admin/stars/cashouts/${id}/approve`)
      toast.success('Approved!')
      fetchCashouts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const markPaid = async (id) => {
    try {
      await api.put(`/admin/stars/cashouts/${id}/paid`)
      toast.success('Marked as paid!')
      fetchCashouts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const rejectCashout = async () => {
    try {
      await api.put(`/admin/stars/cashouts/${rejectId}/reject`, { reason: rejectReason })
      toast.success('Rejected & stars refunded')
      setModal(null)
      setRejectId(null)
      setRejectReason('')
      fetchCashouts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const openEdit = (pkg) => {
    setEditing(pkg)
    setPkgForm({
      name: pkg.name, stars: pkg.stars, bonus_stars: pkg.bonus_stars,
      price_kes: pkg.price_kes, is_popular: pkg.is_popular, is_active: pkg.is_active
    })
    setModal('pkg')
  }

  const STATUS_COLOR = {
    pending:  'text-amber-400 bg-amber-500/10 border-amber-500/30',
    approved: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    paid:     'text-green-400 bg-green-500/10 border-green-500/30',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Stars System</h1>
          <p className="text-sm text-gray-500 mt-1">Manage star packages, pricing & withdrawals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t}
            {t === 'Cashouts' && stats?.pending_cashouts > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.pending_cashouts}</span>
            )}
          </button>
        ))}
      </div>

      {/* SETTINGS TAB */}
      {tab === 'Settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
              <Settings size={16} className="text-brand-400" /> Platform Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { key: 'welcome_stars',          label: 'Welcome Stars (new clients)',    type: 'number', desc: 'Free stars on signup' },
                { key: 'stars_per_message',      label: 'Stars per Message (client pays)',type: 'number', desc: 'Cost per message sent' },
                { key: 'stars_earned_per_reply', label: 'Stars Earned per Reply (escort)',type: 'number', desc: 'Escort earns per reply' },
                { key: 'stars_to_kes_rate',      label: 'Stars → KSh Rate',               type: 'number', desc: 'KSh value of 1 star (e.g. 0.5)' },
                { key: 'min_cashout_stars',      label: 'Minimum Cashout (stars)',        type: 'number', desc: 'Min stars to request withdrawal' },
                { key: 'referral_bonus_stars',   label: 'Referral Bonus (stars)',         type: 'number', desc: 'Stars for referring a friend' },
              ].map(({ key, label, type, desc }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">{label}</label>
                  <input
                    type={type}
                    className="input"
                    value={settings[key] || ''}
                    onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                  />
                  <p className="text-xs text-gray-600 mt-1">{desc}</p>
                </div>
              ))}

              {/* Referral toggle */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setSettings({ ...settings, referral_enabled: settings.referral_enabled === 'true' ? 'false' : 'true' })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.referral_enabled === 'true' ? 'bg-brand-600' : 'bg-dark-600'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.referral_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Referral System</p>
                    <p className="text-xs text-gray-500">Enable clients to earn stars by referring friends</p>
                  </div>
                </label>
              </div>
            </div>

            <button onClick={saveSettings} disabled={saving} className="btn-primary mt-6">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Save Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* PACKAGES TAB */}
      {tab === 'Packages' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditing(null); setPkgForm(EMPTY_PKG); setModal('pkg') }} className="btn-primary text-sm">
              <Plus size={15} /> New Package
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(p => (
              <div key={p.id} className={`bg-dark-800 border rounded-2xl p-5 ${p.is_popular ? 'border-amber-500/40' : 'border-dark-700'} ${!p.is_active ? 'opacity-50' : ''}`}>
                {p.is_popular && (
                  <span className="inline-block bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-3">Popular</span>
                )}
                <p className="font-semibold text-white">{p.name}</p>
                <p className="text-amber-400 font-mono font-bold text-xl mt-1">
                  ⭐ {p.stars + p.bonus_stars}
                  {p.bonus_stars > 0 && <span className="text-green-400 text-sm ml-1">+{p.bonus_stars}</span>}
                </p>
                <p className="text-white font-mono font-bold text-lg">KSh {p.price_kes}</p>
                <p className="text-xs text-gray-500 mt-1">{p.is_active ? 'Active' : 'Inactive'}</p>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => openEdit(p)} className="btn-ghost text-xs py-1.5 px-3 flex-1">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => deletePkg(p.id)} className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CASHOUTS TAB */}
      {tab === 'Cashouts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {['pending', 'approved', 'paid', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setCashoutFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-xl capitalize transition-all ${
                  cashoutFilter === s ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white bg-dark-800 border border-dark-700'
                }`}>
                {s}
              </button>
            ))}
          </div>

          {cashouts.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Banknote size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No {cashoutFilter} requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cashouts.map(c => (
                <div key={c.id} className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-white">{c.escort_name || c.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.email} · {c.phone}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="bg-dark-700 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-500">Stars</p>
                          <p className="font-mono font-bold text-amber-400">⭐ {c.stars_amount}</p>
                        </div>
                        <div className="bg-dark-700 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="font-mono font-bold text-white">KSh {parseFloat(c.kes_amount).toLocaleString()}</p>
                        </div>
                        <div className="bg-dark-700 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-500">M-Pesa</p>
                          <p className="font-mono text-white text-sm font-medium">{c.mpesa_number}</p>
                          <p className="text-xs text-gray-500">{c.mpesa_name}</p>
                        </div>
                      </div>
                      {c.admin_notes && (
                        <p className="text-xs text-red-400 mt-2">Reason: {c.admin_notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_COLOR[c.status]}`}>
                        {c.status}
                      </span>
                      <div className="flex gap-2">
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => approveCashout(c.id)} className="btn-primary text-xs py-1.5 px-3">
                              <Check size={12} /> Approve
                            </button>
                            <button onClick={() => { setRejectId(c.id); setModal('reject') }}
                              className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors">
                              <X size={12} />
                            </button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button onClick={() => markPaid(c.id)} className="btn-primary text-xs py-1.5 px-3">
                            <Banknote size={12} /> Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* STATS TAB */}
      {tab === 'Stats' && stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Stars Issued',       value: stats.total_stars_issued?.toLocaleString(),  color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
              { label: 'Stars Spent',        value: stats.total_stars_spent?.toLocaleString(),   color: 'text-red-400',    bg: 'bg-red-500/10'    },
              { label: 'Stars Earned',       value: stats.total_stars_earned?.toLocaleString(),  color: 'text-green-400',  bg: 'bg-green-500/10'  },
              { label: 'Total Cashouts',     value: `KSh ${stats.total_cashouts_kes?.toLocaleString()}`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Pending Cashouts',   value: stats.pending_cashouts,                      color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Star size={16} className={color} />
                </div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`font-mono font-bold text-xl ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Top escorts */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <TrendingUp size={15} className="text-brand-400" /> Top Escorts by Stars Earned
              </h3>
            </div>
            <div className="divide-y divide-dark-700">
              {stats.top_escorts?.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-5">#{i + 1}</span>
                    <p className="text-sm text-white font-medium">{e.name || 'Unknown'}</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="text-xs font-mono text-amber-400">⭐ {e.balance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Earned</p>
                      <p className="text-xs font-mono text-green-400">⭐ {e.total_earned}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cashed Out</p>
                      <p className="text-xs font-mono text-orange-400">⭐ {e.total_cashed}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== PACKAGE MODAL ===== */}
      {modal === 'pkg' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">{editing ? 'Edit Package' : 'New Package'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { k: 'name',        label: 'Package Name', type: 'text',   placeholder: 'e.g. Starter' },
                { k: 'stars',       label: 'Stars',        type: 'number', placeholder: '100' },
                { k: 'bonus_stars', label: 'Bonus Stars',  type: 'number', placeholder: '0' },
                { k: 'price_kes',   label: 'Price (KSh)',  type: 'number', placeholder: '50' },
              ].map(({ k, label, type, placeholder }) => (
                <div key={k}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input type={type} className="input" placeholder={placeholder}
                    value={pkgForm[k]} onChange={e => setPkgForm({ ...pkgForm, [k]: e.target.value })} />
                </div>
              ))}
              <div className="flex gap-4">
                {[
                  { k: 'is_popular', label: 'Mark as Popular' },
                  { k: 'is_active',  label: 'Active' },
                ].map(({ k, label }) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-brand-500"
                      checked={pkgForm[k]} onChange={e => setPkgForm({ ...pkgForm, [k]: e.target.checked })} />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={savePkg} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REJECT MODAL ===== */}
      {modal === 'reject' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">Reject Withdrawal</h3>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1.5 block">Reason (optional)</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="Reason for rejection..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <p className="text-xs text-gray-500 mb-4">Stars will be automatically refunded to the escort.</p>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={rejectCashout} className="flex-1 py-2 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-colors">
                Reject & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
