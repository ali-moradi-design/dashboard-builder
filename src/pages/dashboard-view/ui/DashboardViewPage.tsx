import { useParams } from '@tanstack/react-router'

import { AppHeader } from '@/widgets/app-header'

export function DashboardViewPage() {
  const { dashboardId } = useParams({ from: '/d/$dashboardId' })
  return (
    <>
      <AppHeader crumbs={dashboardId} />
      <main className="p-5" />
    </>
  )
}
