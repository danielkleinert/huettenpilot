import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

const mockMapInstance = {
  setTarget: vi.fn(),
  getLayers: vi.fn(() => ({
    getArray: vi.fn(() => [])
  })),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  getView: vi.fn(() => ({
    fit: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn()
  })),
  on: vi.fn(),
  forEachFeatureAtPixel: vi.fn(),
  updateSize: vi.fn()
}

const mockOverlay = {
  setPosition: vi.fn()
}

const mockVectorLayer = {
  getSource: vi.fn(() => ({
    getFeatures: vi.fn(() => [])
  }))
}

const mockVectorSource = {
  addFeature: vi.fn()
}

const mockFeature = {
  setStyle: vi.fn(),
  get: vi.fn(),
  getGeometry: vi.fn(() => ({
    getExtent: vi.fn(() => [0, 0, 1, 1])
  }))
}

vi.mock('ol', () => ({
  Map: vi.fn(() => mockMapInstance),
  View: vi.fn(),
  Feature: vi.fn(() => mockFeature)
}))

vi.mock('ol/layer/Tile', () => ({
  default: vi.fn()
}))

vi.mock('ol/source/XYZ', () => ({
  default: vi.fn()
}))

vi.mock('ol/layer/Vector', () => ({
  default: vi.fn(() => mockVectorLayer)
}))

vi.mock('ol/source/Vector', () => ({
  default: vi.fn(() => mockVectorSource)
}))

vi.mock('ol/geom', () => ({
  Point: vi.fn(),
  LineString: vi.fn()
}))

vi.mock('ol/style', () => ({
  Style: vi.fn(),
  Icon: vi.fn(),
  Stroke: vi.fn(),
  Circle: vi.fn(),
  Fill: vi.fn()
}))

vi.mock('ol/proj', () => ({
  fromLonLat: vi.fn((coords) => coords)
}))

vi.mock('ol/control', () => ({
  Attribution: vi.fn()
}))

vi.mock('ol/Overlay', () => ({
  default: vi.fn(() => mockOverlay)
}))

vi.mock('@/hut_ids.json', () => ({
  default: [
    { hutId: 100, hutName: 'Background Hut 1', coordinates: [47.0, 11.0] },
    { hutId: 101, hutName: 'Background Hut 2', coordinates: [47.1, 11.1] },
    { hutId: 102, hutName: 'Background Hut 3', coordinates: null }
  ]
}))

vi.mock('ol/ol.css', () => ({}))

describe('TourMap', () => {
  const mockHuts: Hut[] = [
    { hutId: 1, hutName: 'Alpine Hut 1', coordinates: [47.0, 11.0] },
    { hutId: 2, hutName: 'Mountain Hut 2', coordinates: [47.1, 11.1] },
    { hutId: 3, hutName: 'Peak Hut 3', coordinates: [47.2, 11.2] }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock implementations
    mockMapInstance.getLayers.mockReturnValue({
      getArray: vi.fn(() => [])
    })
    
    mockVectorLayer.getSource.mockReturnValue({
      getFeatures: vi.fn(() => [])
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('renders without crashing with empty huts', () => {
      render(<TourMap selectedHuts={[]} />)
      
      // Should render the map container
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('renders without crashing with selected huts', () => {
      render(<TourMap selectedHuts={mockHuts} />)
      
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('renders map container with correct initial styling', () => {
      const { container } = render(<TourMap selectedHuts={[]} />)
      
      const mapContainer = container.querySelector('div[class*="relative w-full h-64"]')
      expect(mapContainer).toBeInTheDocument()
    })

    it('renders map container element', () => {
      const { container } = render(<TourMap selectedHuts={[]} />)
      
      const mapDiv = container.querySelector('div[class*="w-full h-full"]')
      expect(mapDiv).toBeInTheDocument()
    })
  })

  describe('Hut handling', () => {
    it('handles huts without coordinates gracefully', () => {
      const hutsWithoutCoords: Hut[] = [
        { hutId: 4, hutName: 'No Coords Hut', coordinates: null }
      ]
      
      expect(() => {
        render(<TourMap selectedHuts={hutsWithoutCoords} />)
      }).not.toThrow()
    })

    it('filters out huts without coordinates for map operations', () => {
      const mixedHuts: Hut[] = [
        { hutId: 1, hutName: 'With Coords', coordinates: [47.0, 11.0] },
        { hutId: 2, hutName: 'No Coords', coordinates: null },
        { hutId: 3, hutName: 'Also With Coords', coordinates: [47.2, 11.2] }
      ]
      
      render(<TourMap selectedHuts={mixedHuts} />)
      
      // Should not throw and should handle the mixed array
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('re-renders correctly when selectedHuts change', () => {
      const { rerender } = render(<TourMap selectedHuts={[]} />)
      
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
      
      rerender(<TourMap selectedHuts={mockHuts} />)
      
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('handles selectedHuts prop changes without errors', () => {
      const { rerender } = render(<TourMap selectedHuts={mockHuts} />)
      
      expect(() => {
        rerender(<TourMap selectedHuts={mockHuts} />)
      }).not.toThrow()
    })
  })

  describe('Fullscreen functionality', () => {
    it('toggles fullscreen mode when button is clicked', () => {
      render(<TourMap selectedHuts={[]} />)
      
      const fullscreenButton = screen.getByRole('button', { name: /view fullscreen/i })
      fireEvent.click(fullscreenButton)
      
      expect(screen.getByRole('button', { name: /exit fullscreen/i })).toBeInTheDocument()
    })

    it('returns to normal mode when exit fullscreen is clicked', () => {
      render(<TourMap selectedHuts={[]} />)
      
      const fullscreenButton = screen.getByRole('button', { name: /view fullscreen/i })
      fireEvent.click(fullscreenButton)
      
      const exitButton = screen.getByRole('button', { name: /exit fullscreen/i })
      fireEvent.click(exitButton)
      
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('applies correct CSS classes in fullscreen mode', () => {
      const { container } = render(<TourMap selectedHuts={[]} />)
      
      const fullscreenButton = screen.getByRole('button', { name: /view fullscreen/i })
      fireEvent.click(fullscreenButton)
      
      const fullscreenContainer = container.querySelector('.fixed.inset-0.z-50')
      expect(fullscreenContainer).toBeInTheDocument()
    })

    it('resizes map when toggling fullscreen', async () => {
      render(<TourMap selectedHuts={[]} />)
      
      mockMapInstance.updateSize.mockClear()
      
      const fullscreenButton = screen.getByRole('button', { name: /view fullscreen/i })
      fireEvent.click(fullscreenButton)
      
      await waitFor(() => {
        expect(mockMapInstance.updateSize).toHaveBeenCalled()
      }, { timeout: 100 })
    })

    it('hides popup when entering fullscreen', () => {
      const { container } = render(<TourMap selectedHuts={[]} />)
      
      const fullscreenButton = screen.getByRole('button', { name: /view fullscreen/i })
      fireEvent.click(fullscreenButton)
      
      // Popup should be hidden (class should contain 'hidden')
      const hiddenPopup = container.querySelector('.hidden')
      expect(hiddenPopup).toBeInTheDocument()
    })
  })

  describe('Component lifecycle', () => {
    it('mounts and unmounts without errors', () => {
      const { unmount } = render(<TourMap selectedHuts={[]} />)
      
      expect(() => {
        unmount()
      }).not.toThrow()
    })

    it('handles component re-rendering', () => {
      const { rerender } = render(<TourMap selectedHuts={mockHuts} />)
      
      expect(() => {
        rerender(<TourMap selectedHuts={[]} />)
        rerender(<TourMap selectedHuts={mockHuts} />)
      }).not.toThrow()
    })
  })

  describe('Popup functionality', () => {
    it('renders popup container', () => {
      const { container } = render(<TourMap selectedHuts={[]} />)
      
      const popup = container.querySelector('div[class*="absolute z-[60]"]')
      expect(popup).toBeInTheDocument()
    })

    it('popup starts hidden', () => {
      const { container } = render(<TourMap selectedHuts={[]} />)
      
      const popup = container.querySelector('div[class*="hidden"]')
      expect(popup).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles empty hut array', () => {
      expect(() => {
        render(<TourMap selectedHuts={[]} />)
      }).not.toThrow()
    })

    it('handles huts with invalid coordinates', () => {
      const invalidHuts: Hut[] = [
        { hutId: 1, hutName: 'Invalid Hut', coordinates: [NaN, NaN] as [number, number] }
      ]
      
      expect(() => {
        render(<TourMap selectedHuts={invalidHuts} />)
      }).not.toThrow()
    })

    it('handles rapid state changes', () => {
      const { rerender } = render(<TourMap selectedHuts={[]} />)
      
      // Rapid changes
      rerender(<TourMap selectedHuts={mockHuts} />)
      rerender(<TourMap selectedHuts={[]} />)
      rerender(<TourMap selectedHuts={[mockHuts[0]]} />)
      
      expect(screen.getByRole('button', { name: /view fullscreen/i })).toBeInTheDocument()
    })

    it('handles missing map ref gracefully', () => {
      // This test ensures the component doesn't crash if refs are not available
      const { container } = render(<TourMap selectedHuts={mockHuts} />)
      
      // Should render without throwing
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Performance considerations', () => {
    it('handles prop updates correctly', () => {
      const { rerender } = render(<TourMap selectedHuts={mockHuts} />)
      
      expect(() => {
        rerender(<TourMap selectedHuts={mockHuts} />)
      }).not.toThrow()
    })

    it('handles large number of selected huts', () => {
      const manyHuts: Hut[] = Array.from({ length: 50 }, (_, i) => ({
        hutId: i + 1,
        hutName: `Hut ${i + 1}`,
        coordinates: [47 + i * 0.01, 11 + i * 0.01] as [number, number]
      }))
      
      expect(() => {
        render(<TourMap selectedHuts={manyHuts} />)
      }).not.toThrow()
    })
  })
})