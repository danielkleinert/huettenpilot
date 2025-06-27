import { useQuery } from '@tanstack/react-query'
import { hutApi } from '@/services/hutApi'

export function useHutInfo(hutId: number) {
  return useQuery({
    queryKey: ['hutInfo', hutId],
    queryFn: () => hutApi.fetchHutInfo(hutId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - hut info doesn't change often
    gcTime: 24 * 60 * 60 * 1000,
  })
}