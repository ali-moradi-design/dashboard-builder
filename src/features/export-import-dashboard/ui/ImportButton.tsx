import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DashboardFormatError, type Dashboard } from '@/entities/dashboard'
import { Button, Spinner } from '@/shared/ui'

import { readDashboardFile } from '../model/transfer'

export interface ImportButtonProps {
  existingIds: ReadonlySet<string>
  onImport: (dashboard: Dashboard) => Promise<unknown>
}

export function ImportButton({ existingIds, onImport }: ImportButtonProps) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="import-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setError(null)
          setBusy(true)
          void readDashboardFile(file, existingIds)
            .then(onImport)
            .catch((err: unknown) =>
              setError(
                err instanceof DashboardFormatError
                  ? t('transfer.invalid', { detail: err.message })
                  : err instanceof Error && err.message === 'tooLarge'
                    ? t('transfer.tooLarge')
                    : t('transfer.notJson'),
              ),
            )
            .then(() => setBusy(false))
        }}
      />
      <Button onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <Spinner /> : <Upload aria-hidden />}
        {t('transfer.import')}
      </Button>
      {error && (
        <p role="alert" className="max-w-sm text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
