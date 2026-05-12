import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import TourMap from './TourMap'
import type { Hut } from '@/types'
import React from 'react'

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement> & { onLayoutAnimationStart?: () => void }) => {
      const { onLayoutAnimationStart, children, ...rest } = props
      if (onLayoutAnimationStart) {
        setTimeout(onLayoutAnimationStart, 0)
      }
      return <div {...rest}>{children}</div>
    },
    button: (props: React.HTMLAttributes<HTMLButtonElement>) => {
      const { children, ...rest } = props
      return <button {...rest}>{children}</button>
    }
  }
}))

interface ControlLike { onAdd: () => HTMLElement; onRemove: () => void }

const mockMap = {
  on: vi.fn((event: string, ...args: unknown[]) => {
    if (event === 'load' && typeof args[0] === 'function') {
      ;(args[0] as () => void)()
    }
  }),
  off: vi.fn(),
  addControl: vi.fn((ctrl: ControlLike) => {
    const container = ctrl.onAdd()
    document.body.appendChild(container)
  }),
  removeControl: vi.fn((ctrl: ControlLike) => { ctrl.onRemove() }),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  getSource: vi.fn(),
  setLayoutProperty: vi.fn(),
  setPaintProperty: vi.fn(),
  setTerrain: vi.fn(),
  setSky: vi.fn(),
  getStyle: vi.fn(() => ({ layers: [] })),
  getCanvas: vi.fn(() => ({ style: {} })),
  queryRenderedFeatures: vi.fn(() => []),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  resize: vi.fn(),
  remove: vi.fn(),
}

const mockMarker = {
  setLngLat: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn(),
}

vi.mock('@maptiler/sdk', () => ({
  Map: vi.fn(() => mockMap),
  Marker: vi.fn(() => mockMarker),
  LngLatBounds: vi.fn(() => ({ extend: vi.fn() })),
  MapStyle: { OUTDOOR: 'outdoor' },
  config: { apiKey: '' },
}))

vi.mock('@maptiler/sdk/dist/maptiler-sdk.css', () => ({}))

vi.mock('@/hut_ids.json', () => ({
  default: [
    { hutId: 100, hutName: 'Background Hut 1', coordinates: [47.0, 11.0] },
    { hutId: 101, hutName: 'Background Hut 2', coordinates: [47.1, 11.1] },
    { hutId: 102, hutName: 'Background Hut 3', coordinates: null }
  ]
}))

describe('TourMap', () => {
  const mockHuts: Hut[] = [
    { hutId: 1, hutName: 'Alpine Hut 1', coordinates: [47.0, 11.0] },
    { hutId: 2, hutName: 'Mountain Hut 2', coordinates: [47.1, 11.1] },
    { hutId: 3, hutName: 'Peak Hut 3', coordinates: [47.2, 11.2] }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('renders without crashing with empty huts', () => {
      render(<TourMap selectedHuts={[]} />)
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('renders without crashing with selected huts', () => {
      render(<TourMap selectedHuts={mockHuts} />)
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })
  })

  describe('Hut handling', () => {
    it('handles huts without coordinates gracefully', () => {
      const hutsWithoutCoords: Hut[] = [
        { hutId: 4, hutName: 'No Coords Hut', coordinates: null }
      ]
      expect(() => render(<TourMap selectedHuts={hutsWithoutCoords} />)).not.toThrow()
    })

    it('re-renders correctly when selectedHuts change', () => {
      const { rerender } = render(<TourMap selectedHuts={[]} />)
      rerender(<TourMap selectedHuts={mockHuts} />)
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })
  })

  describe('Fullscreen functionality', () => {
    it('toggles fullscreen mode when button is clicked', () => {
      render(<TourMap selectedHuts={[]} />)
      fireEvent.click(screen.getByRole('button', { name: /view fullscreen/i }))
      expect(screen.getByRole('button', { name: /exit fullscreen/i })).toBeInTheDocument()
    })

    it('returns to normal mode when exit fullscreen is clicked', () => {
      render(<TourMap selectedHuts={[]} />)
      fireEvent.click(screen.getByRole('button', { name: /view fullscreen/i }))
      fireEvent.click(screen.getByRole('button', { name: /exit fullscreen/i }))
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('resizes map when toggling fullscreen', async () => {
      render(<TourMap selectedHuts={[]} />)
      mockMap.resize.mockClear()
      fireEvent.click(screen.getByRole('button', { name: /view fullscreen/i }))
      await waitFor(() => {
        expect(mockMap.resize).toHaveBeenCalled()
      }, { timeout: 100 })
    })
  })

  describe('Component lifecycle', () => {
    it('mounts and unmounts without errors', () => {
      const { unmount } = render(<TourMap selectedHuts={[]} />)
      expect(() => unmount()).not.toThrow()
    })

    it('handles rapid state changes', () => {
      const { rerender } = render(<TourMap selectedHuts={[]} />)
      rerender(<TourMap selectedHuts={mockHuts} />)
      rerender(<TourMap selectedHuts={[]} />)
      rerender(<TourMap selectedHuts={[mockHuts[0]]} />)
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles huts with invalid coordinates', () => {
      const invalidHuts: Hut[] = [
        { hutId: 1, hutName: 'Invalid Hut', coordinates: [NaN, NaN] as [number, number] }
      ]
      expect(() => render(<TourMap selectedHuts={invalidHuts} />)).not.toThrow()
    })

    it('handles large number of selected huts', () => {
      const manyHuts: Hut[] = Array.from({ length: 50 }, (_, i) => ({
        hutId: i + 1,
        hutName: `Hut ${i + 1}`,
        coordinates: [47 + i * 0.01, 11 + i * 0.01] as [number, number]
      }))
      expect(() => render(<TourMap selectedHuts={manyHuts} />)).not.toThrow()
    })
  })
})
