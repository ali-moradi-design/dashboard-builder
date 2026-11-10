import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { I18nextProvider } from 'react-i18next'

import { useDatasetsStore } from '@/entities/dataset'

import { i18n } from './i18n'
import { queryClient } from './queryClient'
import { router } from './router'
import { useDocumentSettings } from './useDocumentSettings'

// Imported datasets live in IndexedDB: read them once, before any widget asks.
void useDatasetsStore.getState().load()

export function App() {
  useDocumentSettings()
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>
  )
}
