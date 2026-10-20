import { useParams } from '@tanstack/react-router'

import { AppHeader } from '@/widgets/app-header'

export function DashboardEditPage() {
  const { dashboardId } = useParams({ from: '/d/$dashboardId/edit' })
  return (
    <>
      <AppHeader crumbs={dashboardId} />
      <main className="p-5" />
    </>
  )
}
