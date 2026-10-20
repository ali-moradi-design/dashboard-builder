import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Dashboard } from '@/entities/dashboard'
import { Button } from '@/shared/ui'

import { exportDashboard } from '../model/transfer'

export function ExportButton({ dashboard }: { dashboard: Dashboard }) {
  const { t } = useTranslation()
  return (
    <Button onClick={() => exportDashboard(dashboard)}>
      <Download aria-hidden />
      <span className="hidden sm:inline">{t('transfer.export')}</span>
      <span className="sr-only sm:hidden">{t('transfer.export')}</span>
    </Button>
  )
}
