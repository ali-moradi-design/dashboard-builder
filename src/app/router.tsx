import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { DashboardEditPage } from '@/pages/dashboard-edit'
import { DashboardViewPage } from '@/pages/dashboard-view'
import { DashboardsListPage } from '@/pages/dashboards-list'
import { DatasetsPage } from '@/pages/datasets'

function NotFound() {
  const { t } = useTranslation()
  return <p className="p-8 text-muted">{t('common.notFound')}</p>
}

function RouteError({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="p-8">
      <h1 className="text-lg font-semibold">{t('common.error')}</h1>
      <pre className="mt-2 text-xs whitespace-pre-wrap text-muted">
        {error instanceof Error ? error.message : String(error)}
      </pre>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardsListPage,
})

/** Global date filter lives in the URL so a link reproduces the view. */
const dateSearch = z.object({
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
})

const viewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/d/$dashboardId',
  validateSearch: dateSearch,
  component: DashboardViewPage,
})

const editRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/d/$dashboardId/edit',
  validateSearch: dateSearch.extend({ query: z.string().optional().catch(undefined) }),
  component: DashboardEditPage,
})

const datasetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/datasets',
  component: DatasetsPage,
})

const routeTree = rootRoute.addChildren([listRoute, viewRoute, editRoute, datasetsRoute])

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
