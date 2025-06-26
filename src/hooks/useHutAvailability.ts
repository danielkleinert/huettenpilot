import { useQueries } from '@tanstack/react-query'
import { hutApi } from '@/services/hutApi'
import type { HutAvailability } from '@/types'

export function useHutAvailability(hutIds: number[]) {
  const queries = useQueries({
    queries: hutIds.map(hutId => ({
      queryKey: ['hutAvailability', hutId],
      queryFn: () => hutApi.fetchHutAvailability(hutId),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }))
  })

  const isLoading = queries.some(query => query.isLoading)
  const isError = queries.some(query => query.isError)
  const errors = queries.filter(query => query.error).map(query => query.error)
  const data: Record<number, HutAvailability[]> = {}
  hutIds.forEach((hutId, index) => {
    const query = queries[index]
    if (query.data) {
      data[hutId] = query.data
    } else if (query.error) {
      data[hutId] = []
    }
  })

  return {
    data,
    isLoading,
    isError,
    errors,
    queries,
  }
}