import { create } from 'zustand'

// Lets the install banner and the notification banner take turns instead of stacking on top of each other.
const usePromptStore = create((set, get) => ({
  active: null,
  claim: (name) => { const a = get().active; if (a && a !== name) return false; set({ active: name }); return true },
  release: (name) => { if (get().active === name) set({ active: null }) },
}))
export default usePromptStore
