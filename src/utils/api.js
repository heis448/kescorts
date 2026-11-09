import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

// Attach token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ke_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Handle 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('ke_token')
      // Only redirect if user WAS logged in (had a token that is now invalid)
      if (token) {
        localStorage.removeItem('ke_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
