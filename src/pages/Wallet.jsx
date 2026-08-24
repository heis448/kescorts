import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Wallet as WalletIcon, Star, Plus, ArrowDownLeft, ArrowUpRight,
  Clock, Crown, RefreshCw, Banknote, X, Check, Loader2, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import MpesaModal from '../components/ui/MpesaModal'
import toast from 'react-hot-toast'

const TABS = ['Wallet', 'Stars', 'Transactions']

export default function Wallet() {
  const { user, setWallet, setStars } = useAuthStore()
  const isEscort = user?.role === 'escort'

  const [data, setData]           = useState({ wallet: null, stars: null, transactions: [], stars_transactions: [], cashouts: [] })
  const [packages, setPackages]   = useState([])
  const [tab, setTab]             = useState('Wallet')
  const [modal, setModal]         = useState(null) // 'topup' | 'buy-stars' | 'redeem' | 'cashout'
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [buyMethod, setBuyMethod] = useState('wallet') // 'wallet' | 'mpesa'
  const [cashoutForm, setCashoutForm] = useState({ stars_amount: '', mpesa_number: '', mpesa_name: '' })
  const [redeemAmount, setRedeemAmount] = useState('')
  const [loading, setLoading]     = useState(false)
  const [topupAmount, setTopupAmount] = useState('')

  const fetchData = () => {
    api.get('/wallet').then(r => {
      setData(r.data)
      setWallet(r.data.wallet)
      setStars(r.data.stars)
    }).catch(() => {})
  }

  useEffect(() => {
    fetchData()
    api.get('/wallet/stars/packages').then(r => setPackages(r.data)).catch(() => {})
  }, [])

  const rate       = data.stars?.rate || 0.5
  const starsBalance = data.stars?.balance || 0
  const netWorthKes  = Math.floor(starsBalance * rate)

  // Buy stars with wallet
  const buyStarsWallet = async () => {
    if (!selectedPkg) return
    setLoading(true)
    try {
      await api.post('/wallet/stars/buy-wallet', { package_id: selectedPkg.id })
      toast.success(`${selectedPkg.stars + selectedPkg.bonus_stars} stars added!`)
      fetchData()
      setModal(null)
      setSelectedPkg(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setLoading(false)
  }

  // Redeem stars to KSh wallet
  const redeemToWallet = async () => {
    if (!redeemAmount || parseInt(redeemAmount) < 1) return
    setLoading(true)
    try {
      const { data: res } = await api.post('/wallet/stars/redeem-wallet', { stars_amount: parseInt(redeemAmount) })
      toast.success(`KSh ${res.kes_credited} added to your wallet!`)
      fetchData()
      setModal(null)
      setRedeemAmount('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setLoading(false)
  }

  // Request cashout
  const requestCashout = async () => {
    const { stars_amount, mpesa_number, mpesa_name } = cashoutForm
    if (!stars_amount || !mpesa_number || !mpesa_name) return toast.error('All fields required')
    setLoading(true)
    try {
      await api.post('/wallet/stars/cashout', {
        stars_amount: parseInt(stars_amount),
        mpesa_number,
        mpesa_name
      })
      toast.success('Withdrawal request submitted!')
      fetchData()
      setModal(null)
      setCashoutForm({ stars_amount: '', mpesa_number: '', mpesa_name: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setLoading(false)
  }

  const STATUS_COLOR = { completed: 'text-green-400', pending: 'text-amber-400', failed: 'text-red-400', paid: 'text-green-400', approved: 'text-blue-400', rejected: 'text-red-400' }
  const TX_TYPE_COLOR = { topup: 'text-green-400', deduct: 'text-red-400', refund: 'text-blue-400' }
  const STARS_TYPE_COLOR = { welcome: 'text-amber-400', earned: 'text-green-400', spent: 'text-red-400', purchased: 'text-blue-400', redeemed: 'text-purple-400', cashout: 'text-orange-400', referral_bonus: 'text-pink-400' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 page-enter">
      <h1 className="font-display font-bold text-2xl text-white mb-6">My Wallet</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* WALLET TAB */}
      {tab === 'Wallet' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* KSh Balance Card */}
          <div className="relative card p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-transparent" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <WalletIcon size={16} className="text-brand-400" />
                    <p className="text-gray-500 text-xs">KSh Balance</p>
                  </div>
                  <p className="font-mono font-black text-4xl text-white">
                    KSh {data.wallet?.available?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Total: KSh {data.wallet?.total_balance?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal('topup')} className="btn-primary py-2 px-4 text-sm">
                  <Plus size={14} /> Add Funds
                </button>
                {isEscort && (
                  <button onClick={() => setModal('redeem')} className="btn-ghost py-2 px-4 text-sm">
                    <Star size={14} /> Redeem Stars
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick topup amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 200, 500, 1000].map(a => (
              <button key={a} onClick={() => { setTopupAmount(String(a)); setModal('topup') }}
                className="py-2.5 text-sm border border-dark-600 hover:border-brand-500 text-gray-400 hover:text-white rounded-xl transition-all">
                +{a}
              </button>
            ))}
          </div>

          {/* Cashout requests (escort only) */}
          {isEscort && data.cashouts?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Withdrawal Requests</h3>
              <div className="space-y-2">
                {data.cashouts.map(c => (
                  <div key={c.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">KSh {parseFloat(c.kes_amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{c.mpesa_name} · {c.mpesa_number}</p>
                      <p className="text-xs text-gray-600">{format(new Date(c.created_at), 'dd MMM yyyy')}</p>
                    </div>
                    <span className={`text-xs font-medium capitalize ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* STARS TAB */}
      {tab === 'Stars' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stars balance */}
          <div className="relative card p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-transparent" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-amber-400" />
                    <p className="text-gray-500 text-xs">Stars Balance</p>
                  </div>
                  <p className="font-mono font-black text-4xl text-white">
                    ⭐ {starsBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Net worth: <span className="text-amber-400 font-medium">KSh {netWorthKes.toLocaleString()}</span>
                    <span className="text-gray-600 ml-1">(@ KSh {rate}/star)</span>
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  { label: 'Earned',    value: data.stars?.total_earned || 0,  color: 'text-green-400' },
                  { label: 'Spent',     value: data.stars?.total_spent || 0,   color: 'text-red-400'   },
                  { label: 'Cashed Out',value: data.stars?.total_cashed || 0,  color: 'text-orange-400'},
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-dark-700/50 rounded-xl p-3 text-center">
                    <p className={`font-mono font-bold text-lg ${color}`}>{value.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-5 flex-wrap">
                {!isEscort && (
                  <button onClick={() => setModal('buy-stars')} className="btn-primary py-2 px-4 text-sm">
                    <Plus size={14} /> Buy Stars
                  </button>
                )}
                {isEscort && (
                  <>
                    <button onClick={() => setModal('redeem')} className="btn-ghost py-2 px-4 text-sm">
                      <RefreshCw size={14} /> Redeem to Wallet
                    </button>
                    <button onClick={() => setModal('cashout')} className="btn-ghost py-2 px-4 text-sm">
                      <Banknote size={14} /> Cash Out
                    </button>
                    <Link to="/membership" className="btn-ghost py-2 px-4 text-sm flex items-center gap-1.5">
                      <Crown size={14} /> Buy Tier with Stars
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Star packages preview — clients only */}
          {!isEscort && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Star Packages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {packages.map(p => (
                <button key={p.id} onClick={() => { setSelectedPkg(p); setModal('buy-stars') }}
                  className={`relative card p-4 text-left hover:border-brand-500 transition-all ${p.is_popular ? 'border-amber-500/50' : ''}`}>
                  {p.is_popular && (
                    <span className="absolute -top-2 left-3 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">Popular</span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{p.name}</p>
                      <p className="text-amber-400 font-mono font-bold">⭐ {(p.stars + p.bonus_stars).toLocaleString()}
                        {p.bonus_stars > 0 && <span className="text-xs text-green-400 ml-1">+{p.bonus_stars} bonus</span>}
                      </p>
                    </div>
                    <p className="font-mono font-bold text-white">KSh {p.price_kes}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          )}
        </motion.div>
      )}

      {/* TRANSACTIONS TAB */}
      {tab === 'Transactions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* KSh transactions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">KSh Transactions</h3>
            {data.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm"><Clock size={24} className="mx-auto mb-2 opacity-40" />No transactions yet</div>
            ) : (
              <div className="space-y-2">
                {data.transactions.map((tx, i) => (
                  <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'topup' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {tx.type === 'topup' ? <ArrowDownLeft size={16} className="text-green-400" /> : <ArrowUpRight size={16} className="text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white">{tx.description}</p>
                        <p className="text-xs text-gray-600">{format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}</p>
                        {tx.mpesa_receipt && <p className="text-xs text-gray-600 font-mono">{tx.mpesa_receipt}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold text-sm ${TX_TYPE_COLOR[tx.type]}`}>
                        {tx.type === 'topup' ? '+' : '-'}KSh {tx.amount?.toLocaleString()}
                      </p>
                      <p className={`text-xs ${STATUS_COLOR[tx.status]}`}>{tx.status}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Stars transactions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Stars Transactions</h3>
            {data.stars_transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm"><Star size={24} className="mx-auto mb-2 opacity-40" />No stars transactions yet</div>
            ) : (
              <div className="space-y-2">
                {data.stars_transactions.map((tx, i) => (
                  <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{tx.description}</p>
                      <p className="text-xs text-gray-600">{format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <p className={`font-mono font-bold text-sm ${STARS_TYPE_COLOR[tx.type]}`}>
                      {['spent','redeemed','cashout'].includes(tx.type) ? '-' : '+'}⭐ {tx.amount}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ============ MODALS ============ */}
      <AnimatePresence>

        {/* Topup Modal */}
        {modal === 'topup' && (
          <MpesaModal
            isOpen={true}
            onClose={() => { setModal(null) }}
            onSuccess={() => { fetchData(); setModal(null) }}
            title="Top Up Wallet"
            endpoint="/wallet/topup"
            verifyEndpoint="/wallet/verify"
          />
        )}

        {/* Buy Stars Modal */}
        {modal === 'buy-stars' && (
          <Modal title="Buy Stars" onClose={() => { setModal(null); setSelectedPkg(null) }}>
            <div className="space-y-3 mb-4">
              {packages.map(p => (
                <button key={p.id} onClick={() => setSelectedPkg(p)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedPkg?.id === p.id ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600 hover:border-dark-400'
                  }`}>
                  <div className="text-left">
                    <p className="font-medium text-white text-sm">{p.name}</p>
                    <p className="text-amber-400 text-sm font-mono">⭐ {p.stars + p.bonus_stars}
                      {p.bonus_stars > 0 && <span className="text-xs text-green-400 ml-1">+{p.bonus_stars} bonus</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-white">KSh {p.price_kes}</p>
                    {selectedPkg?.id === p.id && <Check size={16} className="text-brand-400" />}
                  </div>
                </button>
              ))}
            </div>

            {selectedPkg && (
              <>
                <div className="flex gap-2 mb-4">
                  {['wallet', 'mpesa'].map(m => (
                    <button key={m} onClick={() => setBuyMethod(m)}
                      className={`flex-1 py-2 text-sm rounded-xl border transition-all capitalize ${
                        buyMethod === m ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-600 text-gray-400'
                      }`}>
                      {m === 'wallet' ? '💳 KSh Wallet' : '📱 M-Pesa'}
                    </button>
                  ))}
                </div>

                {buyMethod === 'wallet' ? (
                  <button onClick={buyStarsWallet} disabled={loading} className="btn-primary w-full">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    Pay KSh {selectedPkg.price_kes} from Wallet
                  </button>
                ) : (
                  <MpesaModal
                    isOpen={true}
                    onClose={() => setModal(null)}
                    onSuccess={() => { fetchData(); setModal(null) }}
                    title={`Buy ${selectedPkg.name} Stars`}
                    amount={selectedPkg.price_kes}
                    endpoint="/wallet/stars/buy-mpesa"
                    verifyEndpoint="/wallet/stars/verify"
                    payload={{ package_id: selectedPkg.id }}
                  />
                )}
              </>
            )}
          </Modal>
        )}

        {/* Redeem Stars to Wallet Modal */}
        {modal === 'redeem' && (
          <Modal title="Redeem Stars to Wallet" onClose={() => setModal(null)}>
            <div className="bg-dark-700/50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Available Stars</p>
              <p className="font-mono font-bold text-white text-xl">⭐ {starsBalance.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Rate: KSh {rate} per star</p>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1.5 block">Stars to redeem</label>
              <input type="number" className="input" placeholder={`Max ${starsBalance}`}
                value={redeemAmount} onChange={e => setRedeemAmount(e.target.value)} max={starsBalance} />
              {redeemAmount && (
                <p className="text-xs text-green-400 mt-1.5">
                  = KSh {Math.floor(parseInt(redeemAmount || 0) * rate).toLocaleString()} will be added to your wallet
                </p>
              )}
            </div>
            <button onClick={redeemToWallet} disabled={loading || !redeemAmount} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Redeem Stars
            </button>
          </Modal>
        )}

        {/* Cashout Modal */}
        {modal === 'cashout' && (
          <Modal title="Request Withdrawal" onClose={() => setModal(null)}>
            <div className="bg-dark-700/50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Stars Net Worth</p>
              <p className="font-mono font-bold text-white text-xl">KSh {netWorthKes.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">⭐ {starsBalance} stars @ KSh {rate} each</p>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Stars to cash out</label>
                <input type="number" className="input" placeholder="Amount"
                  value={cashoutForm.stars_amount}
                  onChange={e => setCashoutForm({...cashoutForm, stars_amount: e.target.value})} />
                {cashoutForm.stars_amount && (
                  <p className="text-xs text-green-400 mt-1">
                    = KSh {Math.floor(parseInt(cashoutForm.stars_amount || 0) * rate).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">M-Pesa Number</label>
                <input type="tel" className="input" placeholder="07XXXXXXXX"
                  value={cashoutForm.mpesa_number}
                  onChange={e => setCashoutForm({...cashoutForm, mpesa_number: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">M-Pesa Name</label>
                <input type="text" className="input" placeholder="Name on M-Pesa"
                  value={cashoutForm.mpesa_name}
                  onChange={e => setCashoutForm({...cashoutForm, mpesa_name: e.target.value})} />
              </div>
            </div>
            <button onClick={requestCashout} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
              Submit Withdrawal Request
            </button>
          </Modal>
        )}

      </AnimatePresence>
    </div>
  )
}

// Reusable modal wrapper
function Modal({ title, onClose, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
