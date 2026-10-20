import { Link } from '@tanstack/react-router'
import { LayoutGrid, Settings2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitch } from '@/features/switch-language'
import { ThemeSwitch } from '@/features/switch-theme'
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/shared/ui'

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
          <bdi className="truncate font-semibold text-text">{crumbs}</bdi>
        </nav>
      )}
      <div className="flex-1" />
      <nav aria-label={t('common.mainNav')} className="hidden items-center gap-1 lg:flex">
        <Link
          to="/"
          className="rounded-md px-2.5 py-1.5 text-muted hover:text-text [&.active]:text-text"
          activeOptions={{ exact: true }}
        >
          {t('common.dashboards')}
        </Link>
        <Link
          to="/datasets"
          className="rounded-md px-2.5 py-1.5 text-muted hover:text-text [&.active]:text-text"
        >
          {t('common.datasets')}
        </Link>
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        <LanguageSwitch />
        <ThemeSwitch />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t('settings.title')}
          >
            <Settings2 aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex flex-col gap-3">
          <nav aria-label={t('common.mainNav')} className="flex gap-3">
            <Link to="/">{t('common.dashboards')}</Link>
            <Link to="/datasets">{t('common.datasets')}</Link>
          </nav>
          <LanguageSwitch />
          <ThemeSwitch />
        </PopoverContent>
      </Popover>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
