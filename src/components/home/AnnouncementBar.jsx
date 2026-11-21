import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Megaphone, X, ChevronRight, ExternalLink } from 'lucide-react'
import Sheet from '../ui/Sheet'
import CardSlider from '../ui/CardSlider'

// One slim line under the stories. Tap it to read everything (bottom sheet); ✕ hides the current ones for good.
const KEY = 'ke_ann_dismissed'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }

export default function AnnouncementBar({ announcements = [] }) {
  const [dismissed, setDismissed] = useState(read)
  const [i, setI]       = useState(0)
  const [open, setOpen] = useState(false)
  const live = announcements.filter(a => !dismissed.includes(a.id))

  useEffect(() => {
    if (live.length < 2) return
    const t = setInterval(() => setI(x => (x + 1) % live.length), 6000)
    return () => clearInterval(t)
  }, [live.length])

  if (!live.length) return null
  const a = live[i % live.length]

  const dismiss = (e) => {
    e.stopPropagation()
    const next = [...new Set([...dismissed, ...live.map(x => x.id)])].slice(-50)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    setDismissed(next)
  }

  return (
    <>
      <div className="px-4 mt-3" data-testid="announcement-bar">
        <div className="flex items-center rounded-2xl bg-amber-400/10 border border-amber-400/25 pl-3 pr-1">
          <button onClick={() => setOpen(true)} className="flex-1 min-w-0 flex items-center gap-2 py-2 text-left">
            <Megaphone size={15} className="text-amber-400 flex-shrink-0" />
            <span className="text-[13px] text-amber-100 font-medium truncate">{a.title}</span>
            {live.length > 1 && <span className="text-[10px] text-amber-300/70 flex-shrink-0">{(i % live.length) + 1}/{live.length}</span>}
            <ChevronRight size={14} className="text-amber-300/70 flex-shrink-0 ml-auto" />
          </button>
          <button onClick={dismiss} aria-label="Dismiss announcements" className="w-8 h-8 flex items-center justify-center text-amber-300/70 hover:text-white"><X size={15} /></button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <Sheet onClose={() => setOpen(false)} className="max-w-md">
            <div className="p-5 pt-2 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Megaphone size={18} className="text-amber-400" /> News & updates</h3>
              {live.map(n => {
                const media = (Array.isArray(n.media) ? n.media : []).filter(m => m?.url)
                return (
                  <div key={n.id} className="rounded-2xl border border-dark-600 bg-dark-700/60 overflow-hidden">
                    {media.length > 0 && <div className="aspect-video"><CardSlider items={media.map(m => ({ url: m.url, type: m.type || 'image' }))} className="w-full h-full" /></div>}
                    <div className="p-4 space-y-1.5">
                      <p className="font-semibold text-white">{n.title}</p>
                      {n.body && <p className="text-sm text-gray-300 whitespace-pre-line">{n.body}</p>}
                      {n.link_url && (
                        <a href={n.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-400 font-medium pt-1">
                          Learn more <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )
}
