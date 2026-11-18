// Grey shimmering placeholders shown while content loads (instead of a spinner on an empty page).
// They match the size of the real content so nothing jumps when data arrives.
export const Shimmer = ({ className = '' }) => <div className={`skeleton rounded-lg ${className}`} />

export function EscortCardSkeleton() {
  return (
    <div className="rounded-2xl bg-dark-800 border border-dark-700 overflow-hidden" aria-hidden="true">
      <Shimmer className="aspect-[3/4] rounded-none" />
      <div className="p-3 space-y-2">
        <Shimmer className="h-3.5 w-2/3" />
        <Shimmer className="h-3 w-1/2" />
        <Shimmer className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function ChatRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3" aria-hidden="true">
      <Shimmer className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-1/3" />
        <Shimmer className="h-3 w-3/4" />
      </div>
      <Shimmer className="h-3 w-8" />
    </div>
  )
}

export function SkeletonGrid({ count = 8, className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' }) {
  return (
    <div className={className} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <EscortCardSkeleton key={i} />)}
    </div>
  )
}

export function ChatListSkeleton({ rows = 6 }) {
  return <div role="status" aria-label="Loading chats">{Array.from({ length: rows }, (_, i) => <ChatRowSkeleton key={i} />)}</div>
}
