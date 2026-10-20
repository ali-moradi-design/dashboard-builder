import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useDatasetsStore, type Dataset } from '@/entities/dataset'
import { Button } from '@/shared/ui'

import { importCsv } from '../model/importCsv'

export function ImportCsvButton({ onImported }: { onImported?: (dataset: Dataset) => void }) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const add = useDatasetsStore((s) => s.add)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { dataset, bytes } = await importCsv(file)
      await add(dataset, bytes)
      onImported?.(dataset)
    } catch (e) {
      console.error('CSV import failed', e)
      setError(
        e instanceof Error && e.message === 'tooLarge'
          ? t('datasets.tooLarge')
          : t('datasets.importFailed'),
      )
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
        data-testid="csv-input"
      />
      <Button onClick={() => input.current?.click()} disabled={busy}>
        <Upload aria-hidden />
        {busy ? t('common.loading') : t('datasets.importCsv')}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
