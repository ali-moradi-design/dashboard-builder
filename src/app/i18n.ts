import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources } from '@/shared/i18n'
import { useSettings } from '@/shared/model'

export const i18n = i18next.createInstance()

void i18n.use(initReactI18next).init({
  resources,
  lng: useSettings.getState().lang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})
