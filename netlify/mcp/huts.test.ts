import { describe, it, expect } from 'vitest'
import { findHutsNear, getHut, searchHuts } from './huts.ts'

const BRITANNIAHUETTE = 9
const BRITANNIA_COORDINATES: [number, number] = [46.0600605, 7.9350236]

describe('searchHuts', () => {
  it('finds a hut by a fragment of its name', () => {
    const results = searchHuts('britannia', 20)
    expect(results.map(hut => hut.hutId)).toContain(BRITANNIAHUETTE)
  })

  it('ignores umlauts, case and spacing', () => {
    expect(searchHuts('bluemlisalphutte', 20)[0].hutName).toBe('Blüemlisalphütte SAC')
  })

  it('respects the limit', () => {
    expect(searchHuts('hütte', 3)).toHaveLength(3)
  })

  it('returns nothing for a name that does not exist', () => {
    expect(searchHuts('zzzznotahut', 20)).toEqual([])
  })
})

describe('getHut', () => {
  it('resolves a known id', () => {
    expect(getHut(BRITANNIAHUETTE)?.hutName).toBe('Britanniahütte SAC')
  })

  it('returns undefined for an unknown id', () => {
    expect(getHut(999999)).toBeUndefined()
  })
})

describe('findHutsNear', () => {
  it('sorts by ascending distance and stays inside the radius', () => {
    const results = findHutsNear(BRITANNIA_COORDINATES, 20, 50)

    expect(results.length).toBeGreaterThan(0)
    for (const hut of results) {
      expect(hut.distanceKm).toBeLessThanOrEqual(20)
    }
    const distances = results.map(hut => hut.distanceKm)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  it('excludes the anchor hut itself', () => {
    const results = findHutsNear(BRITANNIA_COORDINATES, 50, 100, BRITANNIAHUETTE)
    expect(results.map(hut => hut.hutId)).not.toContain(BRITANNIAHUETTE)
  })

  it('respects the limit', () => {
    expect(findHutsNear(BRITANNIA_COORDINATES, 100, 5)).toHaveLength(5)
  })

  it('skips huts without coordinates', () => {
    const results = findHutsNear(BRITANNIA_COORDINATES, 5000, 1000)
    expect(results.every(hut => hut.coordinates !== null)).toBe(true)
  })
})
