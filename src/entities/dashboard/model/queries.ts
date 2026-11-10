import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteDashboard, getDashboard, listDashboards, saveDashboard } from '../api/repository'
import type { Dashboard } from './schema'

const keys = {
  all: ['dashboards'] as const,
  one: (id: string) => ['dashboards', id] as const,
}

/** Query options are exported so routes can prefetch before the page renders. */
export const dashboardsQuery = () => queryOptions({ queryKey: keys.all, queryFn: listDashboards })

export const dashboardQuery = (id: string) =>
  queryOptions({ queryKey: keys.one(id), queryFn: () => getDashboard(id) })

export function useDashboards() {
  return useQuery(dashboardsQuery())
}

export function useDashboard(id: string) {
  return useQuery(dashboardQuery(id))
}

export function useSaveDashboard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (d: Dashboard) => saveDashboard(d),
    // The cache gets the document right away, so the view page shows the
    // latest edit even when it opens before the write to IndexedDB finished.
    onMutate: (d) => {
      client.setQueryData(keys.one(d.id), d)
    },
    onSuccess: (saved) => {
      client.setQueryData(keys.one(saved.id), saved)
      void client.invalidateQueries({ queryKey: keys.all, exact: true })
    },
    onError: (_error, d) => {
      void client.invalidateQueries({ queryKey: keys.one(d.id), exact: true })
    },
  })
}

export function useDeleteDashboard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDashboard(id),
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: keys.one(id) })
      void client.invalidateQueries({ queryKey: keys.all, exact: true })
    },
  })
}
