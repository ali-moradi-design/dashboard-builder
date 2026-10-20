import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'en' | 'fa'
export type ThemeChoice = 'light' | 'dark' | 'system'
/** Persian shows native digits by default; users may switch to Latin digits. */
export type Digits = 'native' | 'latin'

interface SettingsState {
  lang: Lang
  theme: ThemeChoice
  digits: Digits
  setLang: (lang: Lang) => void
  setTheme: (theme: ThemeChoice) => void
  setDigits: (digits: Digits) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'en',
      theme: 'system',
      digits: 'native',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setDigits: (digits) => set({ digits }),
    }),
    { name: 'db-settings', version: 1 },
  ),
)
