import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Crown, Wallet, ShieldCheck, TrendingUp, ArrowUpRight } from 'lucide-react'
import api from '../../utils/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cards = [
    { label: 'Total Users',      value: stats?.total_users,        icon: Users,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: 'Total Escorts',    value: stats?.total_escorts,      icon: Users,       color: 'text-pink-400',   bg: 'bg-pink-500/10' },
    { label: 'Active Members',   value: stats?.active_members,     icon: Crown,       color: 'text-amber-400',  bg: 'bg-amber-500/10' },
    { label: 'Pending Verif.',   value: stats?.pending_verifications, icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: "Today's Revenue",  value: `KSh ${Number(stats?.revenue?.today || 0).toLocaleString()}`,   icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Week Revenue',     value: `KSh ${Number(stats?.revenue?.week || 0).toLocaleString()}`,    icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Monthly Revenue',    value: `KSh ${Number(stats?.revenue?.month || 0).toLocaleString()}`,   icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Total Revenue',    value: `KSh ${Number(stats?.revenue?.total || 0).toLocaleString()}`,   icon: Wallet, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-dark-800 border border-dark-600 rounded-2xl p-5"
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-mono font-bold text-xl text-white">{value ?? 0}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      {stats?.revenue_chart?.length > 0 && (
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-400" /> Revenue — Last 30 Days
          </h2>
          <div className="flex items-end gap-1 h-32">
            {stats.revenue_chart.map((d, i) => {
              const max = Math.max(...stats.revenue_chart.map(x => Number(x.total)))
              const pct = max > 0 ? (Number(d.total) / max) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-brand-600/60 hover:bg-brand-500 rounded-t transition-colors"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-dark-600 text-xs text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                    KSh {Number(d.total).toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>{stats.revenue_chart[0]?.date?.slice(5)}</span>
            <span>{stats.revenue_chart[stats.revenue_chart.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Revenue by tier */}
      {stats?.tier_revenue?.length > 0 && (
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Revenue by Tier (30 days)</h2>
          <div className="space-y-3">
            {stats.tier_revenue.map(t => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={14} className="text-amber-400" />
                  <span className="text-sm text-gray-300">{t.name}</span>
                  <span className="text-xs text-gray-600">({t.count} sales)</span>
                </div>
                <span className="font-mono font-medium text-white text-sm">
                  KSh {Number(t.revenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
