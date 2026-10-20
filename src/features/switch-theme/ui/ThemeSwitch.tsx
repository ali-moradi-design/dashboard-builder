import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useSettings, type ThemeChoice } from '@/shared/model'
import { Segmented } from '@/shared/ui'

export function ThemeSwitch() {
  const { t } = useTranslation()
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  return (
    <Segmented<ThemeChoice>
      label={t('settings.theme')}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: <Sun />, title: t('settings.light') },
        { value: 'dark', label: <Moon />, title: t('settings.dark') },
        { value: 'system', label: <Monitor />, title: t('settings.system') },
      ]}
    />
  )
}
