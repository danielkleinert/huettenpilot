import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStateFromUrl, updateUrlState } from './urlState'
import type { Hut } from '@/types'

// Mock window object
const mockLocation = {
  href: 'https://example.com',
  search: ''
}

const mockHistory = {
  replaceState: vi.fn()
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
})

describe('getStateFromUrl', () => {
  beforeEach(() => {
    mockLocation.search = ''
    vi.clearAllMocks()
  })

  it('returns default values when no URL parameters', () => {
    mockLocation.search = ''
    
    const state = getStateFromUrl()
    
    expect(state).toEqual({
      groupSize: 2,
      hutIds: []
    })
  })

  it('parses group size from URL', () => {
    mockLocation.search = '?size=5'
    
    const state = getStateFromUrl()
    
    expect(state.groupSize).toBe(5)
    expect(state.hutIds).toEqual([])
  })

  it('parses hut IDs from URL', () => {
    mockLocation.search = '?huts=1,5,12'
    
    const state = getStateFromUrl()
    
    expect(state.groupSize).toBe(2)
    expect(state.hutIds).toEqual([1, 5, 12])
  })

  it('parses placeholder huts with negative IDs', () => {
    mockLocation.search = '?huts=1,-1,5,-2,12'
    
    const state = getStateFromUrl()
    
    expect(state.hutIds).toEqual([1, -1, 5, -2, 12])
  })

  it('parses both group size and hut IDs', () => {
    mockLocation.search = '?size=8&huts=3,7,-1,15'
    
    const state = getStateFromUrl()
    
    expect(state.groupSize).toBe(8)
    expect(state.hutIds).toEqual([3, 7, -1, 15])
  })

  it('handles invalid group size values', () => {
    mockLocation.search = '?size=invalid'
    
    const state = getStateFromUrl()
    
    expect(state.groupSize).toBe(2) // NaN falls back to default 2
  })

  it('clamps group size to valid range', () => {
    mockLocation.search = '?size=0'
    expect(getStateFromUrl().groupSize).toBe(1) // Minimum
    
    mockLocation.search = '?size=100'
    expect(getStateFromUrl().groupSize).toBe(50) // Maximum
    
    mockLocation.search = '?size=-5'
    expect(getStateFromUrl().groupSize).toBe(1) // Minimum
  })

  it('filters out invalid hut IDs', () => {
    mockLocation.search = '?huts=1,invalid,5,NaN,-1,abc,12'
    
    const state = getStateFromUrl()
    
    expect(state.hutIds).toEqual([1, 5, -1, 12])
  })

  it('handles empty huts parameter', () => {
    mockLocation.search = '?huts='
    
    const state = getStateFromUrl()
    
    expect(state.hutIds).toEqual([])
  })
})

describe('updateUrlState', () => {
  beforeEach(() => {
    mockLocation.href = 'https://example.com'
    vi.clearAllMocks()
  })

  it('updates URL with group size and hut IDs', () => {
    const huts: Hut[] = [
      { hutId: 1, hutName: 'Hut One', coordinates: [47.0, 11.0] },
      { hutId: 5, hutName: 'Hut Five', coordinates: [47.5, 11.5] }
    ]
    
    updateUrlState(4, huts)
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.com/?size=4&huts=1%2C5'
    )
  })

  it('includes placeholder huts in URL', () => {
    const huts: Hut[] = [
      { hutId: 1, hutName: 'Real Hut', coordinates: [47.0, 11.0] },
      { hutId: -1, hutName: 'Placeholder', coordinates: null },
      { hutId: 5, hutName: 'Another Real Hut', coordinates: [47.5, 11.5] },
      { hutId: -2, hutName: 'Placeholder', coordinates: null }
    ]
    
    updateUrlState(6, huts)
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.com/?size=6&huts=1%2C-1%2C5%2C-2'
    )
  })

  it('removes huts parameter when no huts selected', () => {
    updateUrlState(3, [])
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.com/?size=3'
    )
  })

  it('preserves existing URL structure', () => {
    mockLocation.href = 'https://example.com/path?existing=param'
    
    const huts: Hut[] = [
      { hutId: 2, hutName: 'Test Hut', coordinates: [47.0, 11.0] }
    ]
    
    updateUrlState(7, huts)
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.com/path?existing=param&size=7&huts=2'
    )
  })

  it('handles only placeholder huts', () => {
    const huts: Hut[] = [
      { hutId: -1, hutName: 'Placeholder', coordinates: null },
      { hutId: -3, hutName: 'Placeholder', coordinates: null }
    ]
    
    updateUrlState(2, huts)
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.com/?size=2&huts=-1%2C-3'
    )
  })
})