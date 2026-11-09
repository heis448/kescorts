import toast from 'react-hot-toast'

// Turn any failed request into one clear, de-duplicated toast.
// Network outage → a single "connection" toast, not one per request.
export function reportError(err, fallback = 'Something went wrong') {
  if (err?.response?.status === 401) return          // api.js already handles expired sessions
  const msg = err?.response?.data?.error
    || err?.response?.data?.message
    || (err?.response ? fallback : 'Connection problem — check your internet and try again')
  toast.error(msg, { id: err?.response ? `err:${msg}` : 'net-error' })
}
