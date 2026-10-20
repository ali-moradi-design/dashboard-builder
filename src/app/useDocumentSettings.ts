import { useEffect } from 'react'

import { useSettings } from '@/shared/model'

import { i18n } from './i18n'

/** Keeps <html> lang, dir and theme in sync with the saved settings. */
export function useDocumentSettings() {
  const lang = useSettings((s) => s.lang)
  const theme = useSettings((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    html.lang = lang
    html.dir = lang === 'fa' ? 'rtl' : 'ltr'
    void i18n.changeLanguage(lang)
  }, [lang])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}
