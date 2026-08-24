import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Phone, MessageCircle, Lock, Star, ChevronLeft, ChevronRight,
  X, Image, Clock, Ruler, Instagram, CheckCircle, Loader2, AlertCircle
} from 'lucide-react'
import { AnimatePresence as AP } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import BlueTick from '../components/ui/BlueTick'
import { MediaLightbox } from '../components/ui/MediaGallery'

const normalizePhone = (phone) => {
  let p = String(phone).replace(/[\s\-\+]/g, '')
  if (p.startsWith('0') && p.length === 10) return '254' + p.slice(1)
  if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) return '254' + p
  return p
}

// ── Reveal Modal ─────────────────────────────────────────────────────────────
function RevealModal({ profile, onClose, onRevealed }) {
  const { user, stars } = useAuthStore()
  const [step, setStep]         = useState('choose') // choose | mpesa_phone | waiting | done | error
  const [phone, setPhone]       = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [loading, setLoading]   = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [contact, setContact]   = useState(null)
  const [errMsg, setErrMsg]     = useState('')
  const pollRef = useRef(null)

  const paidStars = Math.max(0, (stars?.balance || 0) - (stars?.bonus_balance || 0))
  const canPayStars = user && paidStars >= profile.reveal_price_stars

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  useEffect(() => () => stopPolling(), [])

  const startPolling = (cid) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/match/poll/${cid}`)
        if (data.status === 'completed') {
          stopPolling()
          setContact({ phone: data.phone, whatsapp: data.whatsapp })
          setStep('done')
          onRevealed({ phone: data.phone, whatsapp: data.whatsapp })
          // Save to localStorage for guest
          if (!user) {
            const key = `mr_${profile.uuid}_${phone}`
            localStorage.setItem(key, JSON.stringify({ phone: data.phone, whatsapp: data.whatsapp }))
          }
        } else if (['cancelled', 'failed', 'timeout'].includes(data.status)) {
          stopPolling()
          setErrMsg(data.status === 'cancelled' ? 'Payment was cancelled' : 'Payment failed or timed out')
          setStep('error')
        }
      } catch {}
    }, 3000)
  }

  const pay = async (method) => {
    setLoading(true)
    setErrMsg('')
    try {
      const body = { method }
      if (method === 'mpesa') {
        body.mpesa_phone = user ? mpesaPhone : phone
        body.guest_phone = !user ? phone : undefined
      }
      const { data } = await api.post(`/match/${profile.uuid}/reveal`, body)

      if (data.revealed) {
        setContact({ phone: data.phone, whatsapp: data.whatsapp })
        setStep('done')
        onRevealed({ phone: data.phone, whatsapp: data.whatsapp })
      } else if (data.pending) {
        setCheckoutId(data.checkoutRequestId)
        setStep('waiting')
        startPolling(data.checkoutRequestId)
      }
    } catch (err) {
      const e = err.response?.data
      if (e?.error === 'insufficient_stars') {
        setErrMsg(`Not enough paid stars. You need ${e.required}, have ${e.paid_balance}.`)
      } else {
        setErrMsg(e?.error || 'Something went wrong')
      }
      setStep('error')
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-sm bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <div>
            <p className="font-semibold text-white">Reveal Contact</p>
            <p className="text-xs text-gray-400">{profile.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">

          {/* ── Choose payment ── */}
          {step === 'choose' && (
            <div className="space-y-3">
              <div className="bg-dark-700 rounded-xl p-3 text-center mb-4">
                <p className="text-gray-400 text-xs mb-1">Reveal price</p>
                <p className="text-white font-bold text-lg">KSh {profile.reveal_price_kes?.toLocaleString()}</p>
              </div>

              {/* Guest: need phone first */}
              {!user && (
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1 block">Your phone (for M-Pesa payment)</label>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Stars option (logged in only) */}
              {user && (
                <button
                  onClick={() => pay('stars')}
                  disabled={!canPayStars || loading}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    canPayStars
                      ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-white'
                      : 'bg-dark-700 border-dark-600 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star size={16} className={canPayStars ? 'text-yellow-400' : 'text-gray-600'} />
                    <div className="text-left">
                      <p className="text-sm font-medium">Pay with Stars</p>
                      <p className="text-xs text-gray-400">⭐ {profile.reveal_price_stars} stars · {canPayStars ? `You have ${paidStars} paid` : `Need ${profile.reveal_price_stars - paidStars} more`}</p>
                    </div>
                  </div>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                </button>
              )}

              {/* M-Pesa option */}
              {user && (
                <div className="mb-2">
                  <label className="text-xs text-gray-400 mb-1 block">M-Pesa phone</label>
                  <input
                    type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (!user && !phone.trim()) { toast.error('Enter your phone number'); return }
                  if (user && !mpesaPhone.trim()) { toast.error('Enter M-Pesa phone'); return }
                  pay('mpesa')
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                Pay KSh {profile.reveal_price_kes?.toLocaleString()} via M-Pesa
              </button>

              {!user && (
                <p className="text-center text-xs text-gray-500">
                  <Link to="/login" className="text-brand-400 hover:underline">Login</Link> to pay with stars
                </p>
              )}
            </div>
          )}

          {/* ── Waiting for M-Pesa ── */}
          {step === 'waiting' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <Loader2 size={28} className="text-green-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-semibold">Check your phone</p>
                <p className="text-gray-400 text-sm mt-1">Enter your M-Pesa PIN to complete payment</p>
              </div>
              <div className="bg-dark-700 rounded-xl p-3">
                <p className="text-xs text-gray-500">Amount: <span className="text-white font-medium">KSh {profile.reveal_price_kes?.toLocaleString()}</span></p>
              </div>
              <p className="text-xs text-gray-600">Waiting for confirmation... this may take up to 60 seconds</p>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && contact && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={26} className="text-green-400" />
                </div>
                <p className="text-white font-semibold">Contact Unlocked!</p>
              </div>

              <div className="bg-dark-700 rounded-xl p-4 text-center mb-2">
                <p className="text-gray-400 text-xs mb-1">Phone / WhatsApp</p>
                <p className="text-white font-bold text-lg">{contact.phone || contact.whatsapp}</p>
              </div>

              <div className="flex gap-2">
                {(contact.whatsapp || contact.phone) && (
                  <a
                    href={`https://wa.me/${normalizePhone(contact.whatsapp || contact.phone)}?text=${encodeURIComponent(`Hi ${profile.name}!`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600/20 border border-green-700/30 text-green-400 text-sm font-medium"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-700 border border-dark-600 text-gray-300 text-sm font-medium"
                  >
                    <Phone size={15} /> Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div className="text-center py-4 space-y-4">
              <AlertCircle size={32} className="text-red-400 mx-auto" />
              <p className="text-white font-semibold">Payment Failed</p>
              <p className="text-gray-400 text-sm">{errMsg}</p>
              <button onClick={() => setStep('choose')} className="btn-primary w-full">Try Again</button>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MatchProfile() {
  const { uuid } = useParams()
  const { user } = useAuthStore()
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [lightbox, setLightbox]     = useState(null) // index or null
  const [showReveal, setShowReveal] = useState(false)
  const [revealed, setRevealed]     = useState(null) // { phone, whatsapp }
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/match/${uuid}`)
        setProfile(data)

        // Check if already revealed (logged in)
        if (data.is_verified) {
          const guestKey = `mr_${uuid}_`
          // Check localStorage for guest reveals
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith(guestKey)) {
              try { setRevealed(JSON.parse(localStorage.getItem(k))); break } catch {}
            }
          }
          // Check server for logged-in
          if (user) {
            const { data: rs } = await api.get(`/match/${uuid}/reveal-status`)
            if (rs.revealed) setRevealed({ phone: rs.phone, whatsapp: rs.whatsapp })
          }
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [uuid, user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 text-gray-400">Profile not found</div>
  )

  const media = profile.media || []
  const hasContact = !profile.is_verified || revealed

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <div className="px-4 pt-4 pb-2">
          <Link to="/match" className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors">
            <ChevronLeft size={16} /> Back to Match
          </Link>
        </div>

        {/* Gallery */}
        {media.length > 0 ? (
          <div className="relative">
            {/* Main photo */}
            <div
              className="aspect-[4/5] sm:aspect-[16/9] bg-dark-800 overflow-hidden cursor-pointer"
              onClick={() => setLightbox(currentSlide)}
            >
              {media[currentSlide]?.media_type === 'video' ? (
                <video src={media[currentSlide].url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={media[currentSlide]?.url} alt={profile.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent" />
            </div>

            {/* Nav arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide(c => Math.max(0, c - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-900/70 flex items-center justify-center text-white hover:bg-dark-900 transition-colors"
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentSlide(c => Math.min(media.length - 1, c + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-900/70 flex items-center justify-center text-white hover:bg-dark-900 transition-colors"
                  disabled={currentSlide === media.length - 1}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {media.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-4' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail strip */}
            {media.length > 1 && (
              <div className="flex gap-2 px-4 pt-2 pb-1 overflow-x-auto scrollbar-hide">
                {media.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === currentSlide ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    {m.media_type === 'video'
                      ? <video src={m.url} className="w-full h-full object-cover" muted />
                      : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/5] sm:aspect-[16/9] bg-dark-800 flex items-center justify-center">
            <Image size={48} className="text-gray-700" />
          </div>
        )}

        {/* Info */}
        <div className="px-4 pt-4 space-y-5">

          {/* Name & badge */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-white">{profile.name}</h1>
              {profile.is_verified && <BlueTick size={22} />}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <MapPin size={12} />
              <span>{[profile.city, profile.county].filter(Boolean).join(', ') || 'Kenya'}</span>
              {profile.age && <><span>·</span><span>{profile.age} yrs</span></>}
            </div>
          </div>

          {/* About */}
          {profile.about && (
            <p className="text-gray-200 text-sm italic">"{profile.about}"</p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {profile.availability && (
              <div className="bg-dark-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Availability</p>
                <p className="text-sm text-white flex items-center gap-1"><Clock size={12} className="text-brand-400" /> {profile.availability}</p>
              </div>
            )}
            {profile.height && (
              <div className="bg-dark-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Height</p>
                <p className="text-sm text-white flex items-center gap-1"><Ruler size={12} className="text-brand-400" /> {profile.height}</p>
              </div>
            )}
            {profile.body_type && (
              <div className="bg-dark-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Body Type</p>
                <p className="text-sm text-white">{profile.body_type}</p>
              </div>
            )}
            {profile.rate && (
              <div className="bg-dark-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Rate</p>
                <p className="text-sm text-brand-400 font-mono font-medium">KSh {profile.rate?.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Languages */}
          {profile.languages?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((l, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-dark-700 text-gray-300 text-xs border border-dark-600">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {profile.services?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Interests / Services</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.services.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-brand-600/10 text-brand-400 text-xs border border-brand-600/20">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {profile.description && (
            <div>
              <p className="text-xs text-gray-500 mb-2">About</p>
              <p className="text-sm text-gray-300 leading-relaxed">{profile.description}</p>
            </div>
          )}

          {/* Socials */}
          {(profile.instagram || profile.tiktok) && (
            <div className="flex gap-3">
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300">
                  <Instagram size={13} /> @{profile.instagram}
                </a>
              )}
              {profile.tiktok && (
                <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white">
                  🎵 @{profile.tiktok}
                </a>
              )}
            </div>
          )}

          {/* ── Contact section ── */}
          <div className="border-t border-dark-700 pt-5">
            {!profile.is_verified ? (
              /* Random — show freely */
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Contact</p>
                {profile.phone && (
                  <p className="text-white font-mono font-medium text-lg text-center bg-dark-800 rounded-xl py-3">{profile.phone}</p>
                )}
                <div className="flex gap-2">
                  {(profile.whatsapp || profile.phone) && (
                    <a
                      href={`https://wa.me/${normalizePhone(profile.whatsapp || profile.phone)}?text=${encodeURIComponent(`Hi ${profile.name}, I saw your profile on KenyanEscorts!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 border border-green-700/30 text-green-400 font-medium"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 border border-dark-600 text-gray-300 font-medium">
                      <Phone size={16} /> Call
                    </a>
                  )}
                </div>
              </div>
            ) : revealed ? (
              /* Verified — already revealed */
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-green-400" />
                  <p className="text-xs text-green-400">Contact unlocked</p>
                </div>
                {(revealed.phone || revealed.whatsapp) && (
                  <p className="text-white font-mono font-medium text-lg text-center bg-dark-800 rounded-xl py-3">
                    {revealed.phone || revealed.whatsapp}
                  </p>
                )}
                <div className="flex gap-2">
                  {(revealed.whatsapp || revealed.phone) && (
                    <a
                      href={`https://wa.me/${normalizePhone(revealed.whatsapp || revealed.phone)}?text=${encodeURIComponent(`Hi ${profile.name}!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 border border-green-700/30 text-green-400 font-medium"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  {revealed.phone && (
                    <a href={`tel:${revealed.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 border border-dark-600 text-gray-300 font-medium">
                      <Phone size={16} /> Call
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Verified — locked */
              <div className="text-center space-y-3">
                <div className="bg-dark-800 rounded-xl p-5 border border-dark-700">
                  <Lock size={28} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-white font-semibold mb-1">Contact Hidden</p>
                  <p className="text-gray-500 text-sm">Reveal to get WhatsApp & phone number</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-dark-800 rounded-xl p-3 text-center border border-dark-700">
                    <p className="text-xs text-gray-500">M-Pesa</p>
                    <p className="text-white font-bold">KSh {profile.reveal_price_kes?.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 bg-dark-800 rounded-xl p-3 text-center border border-dark-700">
                    <p className="text-xs text-gray-500">Stars</p>
                    <p className="text-white font-bold">⭐ {profile.reveal_price_stars}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReveal(true)}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Lock size={16} /> Reveal Contact
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <MediaLightbox
            items={media.map(m => ({ url: m.url, type: m.media_type }))}
            startIndex={lightbox}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      {/* Reveal modal */}
      <AnimatePresence>
        {showReveal && (
          <RevealModal
            profile={profile}
            onClose={() => setShowReveal(false)}
            onRevealed={(contact) => { setRevealed(contact); setShowReveal(false) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
