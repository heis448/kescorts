const SOUND_URL = 'https://files.catbox.moe/pt9xg8.mp3'

let _audio = null

const play = () => {
  try {
    if (!_audio) {
      _audio = new Audio(SOUND_URL)
      _audio.preload = 'auto'
    }
    _audio.currentTime = 0
    _audio.volume = 0.6
    _audio.play().catch(() => {})
  } catch {}
}

export const playNotifSound   = () => play()
export const playMessageSound = () => play()
