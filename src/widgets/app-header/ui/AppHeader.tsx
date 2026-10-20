import { Link } from '@tanstack/react-router'
import { LayoutGrid } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitch } from '@/features/switch-language'
import { ThemeSwitch } from '@/features/switch-theme'

export interface AppHeaderProps {
  /** Breadcrumb after the app name, e.g. the dashboard title. */
  crumbs?: ReactNode
  actions?: ReactNode
}

export function AppHeader({ crumbs, actions }: AppHeaderProps) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-border bg-surface px-4 sm:px-5">
      <Link to="/" className="flex items-center gap-2.5 font-semibold">
        <span className="grid size-7 place-items-center rounded-md bg-accent text-accent-fg">
          <LayoutGrid className="size-4" aria-hidden />
        </span>
        <span className="sr-only text-muted sm:not-sr-only">{t('common.dashboards')}</span>
      </Link>
      {crumbs && (
        <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-muted">
          <span aria-hidden>/</span>
          <span className="truncate font-semibold text-text">{crumbs}</span>
        </nav>
      )}
      <div className="flex-1" />
      <div className="hidden items-center gap-2 md:flex">
        <LanguageSwitch />
        <ThemeSwitch />
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
