import { RefreshCw } from 'lucide-react'

export default function ErrorState({ message = 'Could not load this right now.', onRetry }) {
  return (
    <div className="text-center py-16 text-gray-400 space-y-3">
      <p className="text-3xl">😕</p>
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-sm inline-flex items-center gap-2">
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  )
}
