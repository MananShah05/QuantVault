import { useQueries, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PortfolioListItem, Portfolio, PortfolioSnapshot, MetricsResponse } from '@/types'

// Already exists — just confirming usage
export const usePortfolios = () =>
  useQuery<PortfolioListItem[]>({
    queryKey: ['portfolios'],
    queryFn: () => api.get('/api/portfolios').then(r => r.data),
  })

// NEW — fetch snapshots for all ready portfolios in parallel
export const useAllSnapshots = (portfolioIds: string[]) =>
  useQueries({
    queries: portfolioIds.map(id => ({
      queryKey: ['snapshot', id],
      queryFn: () => api.get<PortfolioSnapshot>(`/api/portfolios/${id}/snapshot`).then(r => r.data),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    })),
  })

// NEW — fetch 1Y daily metrics for all ready portfolios in parallel
export const useAllMetrics = (portfolioIds: string[]) =>
  useQueries({
    queries: portfolioIds.map(id => ({
      queryKey: ['metrics', id, '1Y'],
      queryFn: () => api.get<MetricsResponse>(`/api/portfolios/${id}/metrics?range=1Y`).then(r => r.data),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    })),
  })
