import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function MpesaModal({
  isOpen, onClose, onSuccess,
  endpoint, verifyEndpoint,
  payload = {},
  title,
  amount,           // fixed amount (e.g. package price) — if null, show custom input
  allowCustomAmount // if true, show amount input even when amount prop provided
}) {
  const [phone, setPhone] = useState('')

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) { setPhone(''); setCustomAmount(''); setStatus('idle'); setCheckoutId(null) }
  }, [isOpen])

  // Normalize to 254XXXXXXXXX — same logic as backend
  const normalizePhone = (raw) => {
    let p = raw.replace(/[\s\-\+\(\)]/g, '')
    if (p.startsWith('0') && p.length === 10) return '254' + p.slice(1)
    if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) return '254' + p
    return p
  }

  const normalized = normalizePhone(phone)
  const phoneValid = normalized.length === 12 && normalized.startsWith('254')
  const [customAmount, setCustomAmount] = useState('')
  const [status, setStatus]       = useState('idle')
  const [checkoutId, setCheckoutId] = useState(null)

  const finalAmount = amount || (customAmount ? parseInt(customAmount) : null)

  const handlePay = async () => {
    if (!phoneValid) return toast.error('Enter a valid Safaricom number e.g. 0712345678')
    if (!finalAmount || finalAmount < 10) return toast.error('Enter a valid amount (min KSh 10)')
    setStatus('sending')
    try {
      const { data } = await api.post(endpoint, {
        ...payload,
        phone: normalized,   // always send normalized 254XXXXXXXXX
        amount: finalAmount
      })
      const cid = data.checkout_request_id || data.checkoutRequestId
      setCheckoutId(cid)
      setStatus('waiting')
      pollPayment(cid)
    } catch (err) {
      setStatus('failed')
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to send STK push')
    }
  }

  const pollPayment = async (id) => {
    if (!verifyEndpoint) return
    try {
      const { data } = await api.post(verifyEndpoint, { checkoutRequestId: id, ...payload })
      if (data.status === 'completed') {
        setStatus('success')
        toast.success('Payment successful!')
        setTimeout(() => { onSuccess?.(data); onClose() }, 1500)
      } else if (['failed', 'cancelled', 'timeout'].includes(data.status)) {
        setStatus('failed')
        const msgs = {
          cancelled: 'You cancelled the M-Pesa prompt',
          timeout:   'Timed out — no PIN entered',
          failed:    data.resultDesc || 'Payment failed'
        }
        toast.error(msgs[data.status] || 'Payment failed')
      } else {
        setTimeout(() => pollPayment(id), 3000)
      }
    } catch {
      setTimeout(() => pollPayment(id), 3000)
    }
  }

  const reset = () => { setStatus('idle'); setPhone(''); setCheckoutId(null); setCustomAmount('') }

  const handleClose = () => { reset(); onClose() }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-dark-800 border border-dark-500 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Smartphone size={28} className="text-green-400" />
              </div>
              <h3 className="font-display font-bold text-white text-xl">{title}</h3>
              {finalAmount && (
                <p className="text-brand-400 font-mono font-bold text-2xl mt-1">KSh {finalAmount.toLocaleString()}</p>
              )}
            </div>

            {status === 'idle' && (
              <div className="space-y-4">
                {/* Custom amount input — shown when no fixed amount passed */}
                {!amount && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Amount (KSh)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 500"
                      min={10}
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                    />
                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-2">
                      {[100, 250, 500, 1000].map(a => (
                        <button key={a} onClick={() => setCustomAmount(String(a))}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                            customAmount === String(a)
                              ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                              : 'border-dark-600 text-gray-500 hover:border-dark-400'
                          }`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="07XX XXX XXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                    {phone.length > 3 && (
                      <p className={`text-xs mt-1 ${phoneValid ? 'text-green-400' : 'text-red-400'}`}>
                        {phoneValid ? `✓ Will send to: ${normalized}` : 'Invalid number — use 07XXXXXXXX or 254XXXXXXXXX'}
                      </p>
                    )}
                    {!phone && <p className="text-xs text-gray-600 mt-1">Safaricom number registered to M-Pesa</p>}
                  </div>

                <button
                  onClick={handlePay}
                  disabled={!phoneValid || !finalAmount}
                  className="btn-primary w-full justify-center bg-green-600 hover:bg-green-500 disabled:opacity-40"
                >
                  Pay KSh {finalAmount?.toLocaleString() || '—'}
                </button>
              </div>
            )}

            {status === 'sending' && (
              <div className="text-center py-4">
                <Loader2 size={32} className="text-brand-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-300">Sending STK push...</p>
              </div>
            )}

            {status === 'waiting' && (
              <div className="text-center py-4">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-green-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin" />
                  <Smartphone size={20} className="absolute inset-0 m-auto text-green-400" />
                </div>
                <p className="text-white font-medium mb-1">Check your phone</p>
                <p className="text-sm text-gray-400">Enter your M-Pesa PIN to complete payment</p>
                {verifyEndpoint && (
                  <button onClick={() => pollPayment(checkoutId)}
                    className="mt-4 text-xs text-brand-400 hover:text-brand-300 underline">
                    Check payment status
                  </button>
                )}
              </div>
            )}

            {status === 'success' && (
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">Payment Successful!</p>
                <p className="text-sm text-gray-400 mt-1">Processing your request...</p>
              </div>
            )}

            {status === 'failed' && (
              <div className="text-center py-4 space-y-4">
                <AlertCircle size={48} className="text-red-400 mx-auto" />
                <p className="text-white font-medium">Payment Failed</p>
                <p className="text-sm text-gray-400">The payment was cancelled or failed</p>
                <button onClick={reset} className="btn-primary w-full justify-center">Try Again</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
