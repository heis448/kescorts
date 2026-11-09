import { useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'

export default function AdminTransactions() {
  const [txs, setTxs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType]     = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const p = new URLSearchParams()
    if (type)   p.set('type', type)
    if (status) p.set('status', status)
    api.get(`/admin/transactions?${p}`).then(r => { setTxs(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [type, status])

  const STATUS_COLOR = { completed:'text-green-400', pending:'text-amber-400', failed:'text-red-400' }
  const totalRevenue = txs.filter(t => t.status === 'completed' && t.type === 'topup').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">All M-Pesa payments across the platform</p>
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-2 text-right">
          <p className="text-xs text-gray-500">Showing total</p>
          <p className="font-mono font-bold text-white">KSh {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-xl p-1">
          {['','topup','deduct','refund'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${type === t ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              {t || 'All Types'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-xl p-1">
          {['','completed','pending','failed'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${status === s ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              {s || 'All Status'}
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
                  {['User','Type','Amount','Description','Receipt','Status','Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {txs.map(tx => (
                  <tr key={tx.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{tx.email}</p>
                      <p className="text-gray-600 text-xs">{tx.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tx.type === 'topup' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {tx.type === 'topup'
                          ? <ArrowDownLeft size={13} className="text-green-400" />
                          : <ArrowUpRight size={13} className="text-red-400" />
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${tx.type === 'topup' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'topup' ? '+' : '-'}KSh {Number(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{tx.description}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{tx.mpesa_receipt || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs capitalize ${STATUS_COLOR[tx.status] || 'text-gray-400'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {format(new Date(tx.created_at), 'dd MMM HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txs.length === 0 && (
              <p className="text-center py-12 text-gray-600 text-sm">No transactions found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
