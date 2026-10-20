import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteDashboard, getDashboard, listDashboards, saveDashboard } from '../api/repository'
import type { Dashboard } from './schema'

const keys = {
  all: ['dashboards'] as const,
  one: (id: string) => ['dashboards', id] as const,
}

export function useDashboards() {
  return useQuery({ queryKey: keys.all, queryFn: listDashboards })
}

export function useDashboard(id: string) {
  return useQuery({ queryKey: keys.one(id), queryFn: () => getDashboard(id) })
}

export function useSaveDashboard() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (d: Dashboard) => saveDashboard(d),
    onSuccess: (saved) => {
      client.setQueryData(keys.one(saved.id), saved)
      void client.invalidateQueries({ queryKey: keys.all, exact: true })
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
