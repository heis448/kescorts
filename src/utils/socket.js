import { io } from 'socket.io-client'
let socket = null
export const connectSocket = () => {
  if (socket) { socket.disconnect(); socket = null }
  const token = localStorage.getItem('ke_token')
  const rawUrl = import.meta.env.VITE_SOCKET_URL || '/'
  const url = new URL(rawUrl, window.location.origin)
  const origin = url.origin
  const path = (url.pathname.replace(/\/$/, '') || '') + '/socket.io'
  socket = io(origin, { path, auth: { token }, transports: ['websocket'], autoConnect: true })
  return socket
}
export const getSocket = () => { if (!socket) return connectSocket(); return socket }
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null } }
