import { useTranslation } from 'react-i18next'

import { useSettings, type Digits, type Lang } from '@/shared/model'
import { Segmented } from '@/shared/ui'

export function LanguageSwitch() {
  const { t } = useTranslation()
  const lang = useSettings((s) => s.lang)
  const setLang = useSettings((s) => s.setLang)
  const digits = useSettings((s) => s.digits)
  const setDigits = useSettings((s) => s.setDigits)
  return (
    <div className="flex items-center gap-2">
      <Segmented<Lang>
        label={t('settings.language')}
        value={lang}
        onChange={setLang}
        options={[
          { value: 'en', label: 'EN', title: 'English' },
          { value: 'fa', label: 'فا', title: 'فارسی' },
        ]}
      />
      {lang === 'fa' && (
        <Segmented<Digits>
          label={t('settings.digits')}
          value={digits}
          onChange={setDigits}
          options={[
            { value: 'native', label: '۱۲۳', title: t('settings.nativeDigits') },
            { value: 'latin', label: '123', title: t('settings.latinDigits') },
          ]}
        />
      )}
    </div>
  )
}
