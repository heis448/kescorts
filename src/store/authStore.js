import { create } from 'zustand'
import api from '../utils/api'
import { connectSocket, disconnectSocket } from '../utils/socket'

const useAuthStore = create((set, get) => ({
  user:                 null,
  wallet:               null,
  stars:                null,
  membership:           null,
  unread_notifications: 0,
  token:                localStorage.getItem('ke_token'),
  loading:              false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('ke_token', data.token)
      set({ token: data.token, user: data.user, loading: false })
      connectSocket() // reconnect with fresh token
      return { success: true, user: data.user }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    }
  },

  register: async (payload) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', payload)
      localStorage.setItem('ke_token', data.token)
      set({ token: data.token, user: data.user, loading: false })
      connectSocket() // connect with new user token
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, error: err.response?.data?.error || 'Registration failed' }
    }
  },

  fetchMe: async (silent = false) => {
    if (!silent) set({ loading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({
        user: data.user,
        wallet: data.wallet,
        stars: data.stars,
        membership: data.membership,
        unread_notifications: data.unread_notifications || 0,
        loading: false
      })
    } catch { set({ loading: false }) }
  },

  logout: () => {
    localStorage.removeItem('ke_token')
    disconnectSocket()
    set({ user: null, token: null, wallet: null, stars: null, membership: null, unread_notifications: 0 })
  },

  setWallet:     (wallet)     => set({ wallet }),
  setStars:      (stars)      => set({ stars }),
  setMembership: (membership) => set({ membership }),
  setUnreadNotifications: (count) => set({ unread_notifications: count }),
  decrementUnread: () => set(s => ({ unread_notifications: Math.max(0, s.unread_notifications - 1) })),
}))

export default useAuthStore
