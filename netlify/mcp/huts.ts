import hutData from '../../src/hut_ids.json' with { type: 'json' }
import { calculateDistance, fuzzyHutNameMatch } from '../../src/lib/utils.ts'

export interface HutEntry {
  hutId: number
  hutName: string
  coordinates: [number, number] | null
}

export interface NearbyHut extends HutEntry {
  distanceKm: number
}

const huts = hutData as unknown as HutEntry[]
const hutsById = new Map(huts.map(hut => [hut.hutId, hut]))

export function getHut(hutId: number): HutEntry | undefined {
  return hutsById.get(hutId)
}

export function searchHuts(query: string, limit: number): HutEntry[] {
  return huts.filter(hut => fuzzyHutNameMatch(hut.hutName, query)).slice(0, limit)
}

export function findHutsNear(
  anchor: [number, number],
  radiusKm: number,
  limit: number,
  excludeHutId?: number
): NearbyHut[] {
  return huts
    .filter(hut => hut.coordinates !== null && hut.hutId !== excludeHutId)
    .map(hut => ({
      ...hut,
      distanceKm: Math.round(calculateDistance(anchor, hut.coordinates!) * 10) / 10
    }))
    .filter(hut => hut.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}
