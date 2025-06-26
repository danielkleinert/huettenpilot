import type { HutAvailability } from '@/types'

export const hutApi = {
  async fetchHutAvailability(hutId: number): Promise<HutAvailability[]> {
    const response = await fetch(`/api/v1/reservation/getHutAvailability?hutId=${hutId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch availability for hut ${hutId}: ${response.statusText}`)
    }
    return response.json()
  }
}