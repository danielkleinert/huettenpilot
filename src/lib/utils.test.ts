import { describe, it, expect } from 'vitest'
import { cn, calculateDistance } from './utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
  })

  it('handles conditional classes', () => {
    expect(cn('btn', { 'btn-primary': true, 'btn-secondary': false })).toBe('btn btn-primary')
  })

  it('resolves Tailwind conflicts with tailwind-merge', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
    expect(cn('px-4', 'p-2')).toBe('p-2')
  })

  it('handles empty and undefined inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(undefined)).toBe('')
    expect(cn(null)).toBe('')
  })

  it('handles arrays of classes', () => {
    expect(cn(['btn', 'btn-primary'], 'active')).toBe('btn btn-primary active')
  })

  it('handles complex nested scenarios', () => {
    expect(cn(
      'btn',
      { 'btn-primary': true },
      ['active', { 'disabled': false }],
      'hover:bg-blue-600'
    )).toBe('btn btn-primary active hover:bg-blue-600')
  })
})

describe('calculateDistance', () => {
  it('calculates distance between same coordinates as 0', () => {
    const coord = [47.0502, 8.3093] as [number, number] // Lucerne
    expect(calculateDistance(coord, coord)).toBe(0)
  })

  it('calculates accurate distance between known Swiss locations', () => {
    const lucerne = [47.0502, 8.3093] as [number, number]
    const zurich = [47.3769, 8.5417] as [number, number]
    const distance = calculateDistance(lucerne, zurich)
    expect(distance).toBeCloseTo(40.3, 1) // ~40.3 km actual distance
  })

  it('calculates distance between Alpine hut coordinates', () => {
    const monterosaHutte = [45.9203, 7.8667] as [number, number] // Monte Rosa Hütte
    const matterhorn = [45.9763, 7.6586] as [number, number] // Hörnlihütte
    const distance = calculateDistance(monterosaHutte, matterhorn)
    expect(distance).toBeCloseTo(17.3, 1) // ~17.3 km actual distance
  })

  it('handles long distances correctly', () => {
    const switzerland = [46.8182, 8.2275] as [number, number]
    const nepal = [28.3949, 84.1240] as [number, number]
    const distance = calculateDistance(switzerland, nepal)
    expect(distance).toBeGreaterThan(6000) // > 6000 km
    expect(distance).toBeLessThan(8000) // < 8000 km
  })

  it('handles negative coordinates', () => {
    const coord1 = [-45.0, -90.0] as [number, number]
    const coord2 = [-46.0, -91.0] as [number, number]
    const distance = calculateDistance(coord1, coord2)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeCloseTo(135.8, 1)
  })

  it('handles coordinates across meridian', () => {
    const coord1 = [45.0, 179.5] as [number, number]
    const coord2 = [45.0, -179.5] as [number, number]
    const distance = calculateDistance(coord1, coord2)
    expect(distance).toBeCloseTo(78.6, 1) // shortest great circle distance
  })

  it('calculates maximum distance (antipodal points)', () => {
    const coord1 = [0.0, 0.0] as [number, number]
    const coord2 = [0.0, 180.0] as [number, number]
    const distance = calculateDistance(coord1, coord2)
    expect(distance).toBeCloseTo(20015, 0) // ~half Earth's circumference
  })

  it('handles edge case coordinates', () => {
    const northPole = [90.0, 0.0] as [number, number]
    const southPole = [-90.0, 0.0] as [number, number]
    const distance = calculateDistance(northPole, southPole)
    expect(distance).toBeCloseTo(20015, 0) // ~half Earth's circumference
  })
})