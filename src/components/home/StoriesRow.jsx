import { Link } from 'react-router-dom'
import { StoryRing } from '../ui/StoryViewer'
import LazyImage from '../ui/LazyImage'

// Instagram-style top rail: stories first (red rings), then who is online right now (green rings).
export default function StoriesRow({ stories = [], online = [], onOpenStory }) {
  if (!stories.length && !online.length) return null
  return (
    <div className="max-w-7xl mx-auto px-4 mt-3" data-testid="stories-row">
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 items-start">
        {stories.map((g, i) => (
          <StoryRing key={g.user_id} user={{ name: g.name, avatar: g.avatar, is_online: g.is_online }}
            stories={g.stories} size="md" onClick={() => onOpenStory?.(i)} />
        ))}

        {stories.length > 0 && online.length > 0 && <div className="w-px self-stretch bg-white/10 flex-shrink-0 my-1" />}

        {online.map(e => (
          <Link key={e.uuid} to={`/escort/${e.uuid}`} className="flex-shrink-0 w-16 flex flex-col items-center gap-1.5 group" data-testid="online-avatar">
            <span className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-green-400 to-emerald-600">
              <span className="block w-full h-full rounded-full overflow-hidden border-2 border-dark-900 bg-dark-700">
                {e.primary_photo && <LazyImage src={e.primary_photo} alt={e.name} className="w-full h-full" />}
              </span>
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-dark-900 rounded-full" />
            </span>
            <span className="text-[11px] text-gray-300 group-hover:text-white truncate max-w-full">{e.name || ''}</span>
          </Link>
        ))}
      </div>
      {online.length > 0 && <p className="text-[10px] text-green-400/80 font-medium tracking-wide mt-0.5">● {online.length} online now</p>}
    </div>
  )
}
