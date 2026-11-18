import { useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'

// A popup that slides up from the bottom on phones (drag the handle or swipe down to close)
// and is a normal centered box on bigger screens. Render it inside <AnimatePresence> for the exit animation.
export default function Sheet({ onClose, children, className = 'max-w-md', backdrop = 'bg-black/70 backdrop-blur-sm' }) {
  const controls = useDragControls()
  const phone = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 ${backdrop} z-50 flex items-end sm:items-center justify-center sm:p-4`}
      onClick={e => e.target === e.currentTarget && onClose?.()}
      data-sheet-backdrop
    >
      <motion.div
        role="dialog" aria-modal="true"
        initial={phone ? { y: '100%' } : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={phone ? { y: '100%' } : { y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 34, stiffness: 340 }}
        drag={phone ? 'y' : false} dragControls={controls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose?.() }}
        className={`relative w-full ${className} bg-dark-800 border border-dark-600 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* grab handle (phones) */}
        <div className="sm:hidden sticky top-0 z-10 flex justify-center pt-2.5 pb-1.5 bg-dark-800 touch-none cursor-grab"
             onPointerDown={e => controls.start(e)} data-sheet-handle>
          <span className="w-10 h-1.5 rounded-full bg-white/25" />
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
