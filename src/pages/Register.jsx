import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, X } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ email: '', phone: '', password: '', confirmPassword: '', role: 'client' })
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'

    if (!form.phone) e.phone = 'Phone is required'
    else if (!/^0[17]\d{8}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid  number (07XX or 01XX)'

    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'

    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'

    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    const { confirmPassword, ...payload } = form
    const res = await register(payload)
    if (res.success) { toast.success('Account created!'); navigate('/dashboard') }
    else toast.error(res.error)
  }

  const field = (key, value) => {
    setForm({ ...form, [key]: value })
    if (errors[key]) setErrors({ ...errors, [key]: null })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">

        {/* Close button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-4 right-0 p-2 text-gray-500 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-2">Create Account</h1>
          <p className="text-gray-500">Join Kenya Escorts today</p>
        </div>

        <div className="card p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 bg-dark-700 p-1 rounded-xl">
            {[{v:'client',l:"I'm a Client"},{v:'escort',l:"I'm an Escort"}].map(({v,l}) => (
              <button key={v} type="button" onClick={() => setForm({...form, role: v})}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.role === v ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}>{l}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
              <input type="email" className={`input ${errors.email ? 'border-red-500' : ''}`} placeholder="you@example.com"
                value={form.email} onChange={e => field('email', e.target.value)} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Phone (M-Pesa)</label>
              <input type="tel" className={`input ${errors.phone ? 'border-red-500' : ''}`} placeholder="07XX XXX XXX"
                value={form.phone} onChange={e => field('phone', e.target.value)} />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`} placeholder="Min 6 characters"
                  value={form.password} onChange={e => field('password', e.target.value)} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} className={`input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`} placeholder="Repeat your password"
                  value={form.confirmPassword} onChange={e => field('confirmPassword', e.target.value)} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {form.role === 'escort' && (
              <div className="bg-brand-600/10 border border-brand-600/20 rounded-xl p-3 text-xs text-brand-300">
                As an escort, you'll need to purchase a membership to activate your profile and appear in listings.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-12 mt-2">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={16}/> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
