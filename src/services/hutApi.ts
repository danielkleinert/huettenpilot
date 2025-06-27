import type { HutAvailability, HutInfo } from '@/types'

export const hutApi = {
  async fetchHutAvailability(hutId: number): Promise<HutAvailability[]> {
    const response = await fetch(`/api/v1/reservation/getHutAvailability?hutId=${hutId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch availability for hut ${hutId}: ${response.statusText}`)
    }
    return response.json()
  },

  async fetchHutInfo(hutId: number): Promise<HutInfo> {
    const response = await fetch(`/api/v1/reservation/hutInfo/${hutId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch hut info for hut ${hutId}: ${response.statusText}`)
    }
    return response.json()
  }
}