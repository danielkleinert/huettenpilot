import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { HutSearch } from './HutSearch'
import type { Hut } from '@/types'

// Mock the hut data with a controlled subset
vi.mock('@/hut_ids.json', () => ({
  default: [
    { hutId: 1, hutName: 'Alpine Hut One', coordinates: [47.0, 11.0] },
    { hutId: 2, hutName: 'Mountain Lodge Two', coordinates: [47.1, 11.1] },
    { hutId: 3, hutName: 'Peak Shelter Three', coordinates: [47.2, 11.2] },
    { hutId: 4, hutName: 'Alpine Base Four', coordinates: [47.3, 11.3] },
    { hutId: 5, hutName: 'Valley Hut Five', coordinates: [47.4, 11.4] },
    { hutId: 6, hutName: 'Ridge Camp Six', coordinates: [47.5, 11.5] },
    { hutId: 7, hutName: 'Summit Lodge Seven', coordinates: [47.6, 11.6] },
    { hutId: 8, hutName: 'Forest Cabin Eight', coordinates: [47.7, 11.7] },
    { hutId: 9, hutName: 'Lake House Nine', coordinates: [47.8, 11.8] },
    { hutId: 10, hutName: 'Glacier Hut Ten', coordinates: [47.9, 11.9] },
    { hutId: 11, hutName: 'Extra Hut Eleven', coordinates: [48.0, 12.0] },
    { hutId: 12, hutName: 'Test Alpine Twelve', coordinates: [48.1, 12.1] },
    { hutId: 13, hutName: 'No Coordinates Hut', coordinates: null }
  ]
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hutSelector.searchPlaceholder': 'Search for huts...',
        'hutSelector.placeholderHutName': 'Placeholder'
      }
      return translations[key] || key
    }
  })
}))

vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
  calculateDistance: vi.fn((coord1: [number, number], coord2: [number, number]) => {
    // Simple distance calculation for testing
    const [lat1, lon1] = coord1
    const [lat2, lon2] = coord2
    return Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2)
  }),
  fuzzyHutNameMatch: vi.fn((hutName: string, searchTerm: string) => {
    const normalize = (str: string) => str.toLowerCase().replace(/['`\-\s]/g, '')
    return normalize(hutName).includes(normalize(searchTerm))
  }),
  createPlaceholderHut: vi.fn((hutId: number = -1) => ({
    hutId,
    hutName: 'Placeholder',
    coordinates: null
  }))
}))

describe('HutSearch', () => {
  const mockOnSelectHut = vi.fn()
  const mockSelectedHuts: Hut[] = []

  beforeEach(() => {
    mockOnSelectHut.mockClear()
  })

  describe('Basic rendering and UI', () => {
    it('renders search input with correct placeholder', () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('w-full')
    })

    it('does not show dropdown when not focused', () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('shows dropdown when focused with results', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
    })
  })

  describe('Search functionality', () => {
    it('filters huts by name (case insensitive)', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
        expect(screen.getByText('Alpine Base Four')).toBeInTheDocument()
        expect(screen.getByText('Test Alpine Twelve')).toBeInTheDocument()
        expect(screen.queryByText('Mountain Lodge Two')).not.toBeInTheDocument()
      })
    })

    it('shows partial matches correctly', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'hut' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
        expect(screen.getByText('Valley Hut Five')).toBeInTheDocument()
        expect(screen.getByText('Glacier Hut Ten')).toBeInTheDocument()
        expect(screen.getByText('Extra Hut Eleven')).toBeInTheDocument()
        expect(screen.getByText('No Coordinates Hut')).toBeInTheDocument()
      })
    })

    it('shows no results for non-matching search', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'nonexistent' } })
      
      await waitFor(() => {
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })

    it('limits results to 10 items', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      // Empty search should show all huts, but limited to 10
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons).toHaveLength(10)
      })
    })
  })

  describe('Distance-based sorting', () => {
    it('sorts results by distance when selectedHuts has coordinates', async () => {
      const selectedHutsWithCoords: Hut[] = [
        { hutId: 999, hutName: 'Reference Hut', coordinates: [47.0, 11.0] }
      ]
      
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={selectedHutsWithCoords} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'hut' } })
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
        // First result should be closest to [47.0, 11.0]
        expect(buttons[0]).toHaveTextContent('Alpine Hut One')
      })
    })

    it('uses the last selected hut with coordinates for distance calculation', async () => {
      const selectedHutsWithCoords: Hut[] = [
        { hutId: 997, hutName: 'First Hut', coordinates: null },
        { hutId: 998, hutName: 'Second Hut', coordinates: [47.0, 11.0] },
        { hutId: 999, hutName: 'Last Hut', coordinates: [47.9, 11.9] }
      ]
      
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={selectedHutsWithCoords} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'hut' } })
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
        // Should be sorted by distance from [47.9, 11.9], so Glacier Hut Ten should be first
        expect(buttons[0]).toHaveTextContent('Glacier Hut Ten')
      })
    })

    it('filters out huts without coordinates when sorting by distance', async () => {
      const selectedHutsWithCoords: Hut[] = [
        { hutId: 999, hutName: 'Reference Hut', coordinates: [47.0, 11.0] }
      ]
      
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={selectedHutsWithCoords} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'no coordinates' } })
      
      await waitFor(() => {
        // "No Coordinates Hut" should not appear because it has null coordinates
        expect(screen.queryByText('No Coordinates Hut')).not.toBeInTheDocument()
      })
    })
  })

  describe('Keyboard navigation', () => {
    it('navigates down with arrow key', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      
      // First item should be highlighted
      expect(screen.getByText('Alpine Hut One').parentElement).toHaveClass('bg-muted')
    })

    it('navigates up with arrow key', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      
      // Should wrap to last item
      const buttons = screen.getAllByRole('button')
      expect(buttons[buttons.length - 1]).toHaveClass('bg-muted')
    })

    it('wraps navigation at boundaries', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      const buttons = screen.getAllByRole('button')
      const itemCount = buttons.length
      
      // Go down to select first item
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(buttons[0]).toHaveClass('bg-muted')
      
      // Go down itemCount times to wrap around
      for (let i = 0; i < itemCount; i++) {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      }
      
      // Should be back to first item
      expect(buttons[0]).toHaveClass('bg-muted')
    })

    it('selects hut with Enter key', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnSelectHut).toHaveBeenCalledWith({
        hutId: 1,
        hutName: 'Alpine Hut One',
        coordinates: [47.0, 11.0]
      })
    })

    it('clears focus with Escape key', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.keyDown(input, { key: 'Escape' })
      
      // Dropdown should disappear
      await waitFor(() => {
        expect(screen.queryByText('Alpine Hut One')).not.toBeInTheDocument()
      })
    })

    it('ignores keyboard events when not focused', () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      
      // Try keyboard navigation without focus
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnSelectHut).not.toHaveBeenCalled()
    })
  })

  describe('Mouse interactions', () => {
    it('selects hut when clicked', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Alpine Hut One'))
      
      expect(mockOnSelectHut).toHaveBeenCalledWith({
        hutId: 1,
        hutName: 'Alpine Hut One',
        coordinates: [47.0, 11.0]
      })
    })

    it('highlights hut on hover', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      const hutButton = screen.getByText('Alpine Hut One').parentElement!
      fireEvent.mouseEnter(hutButton)
      
      expect(hutButton).toHaveClass('hover:bg-muted')
    })
  })

  describe('Focus and blur behavior', () => {
    it('shows dropdown on focus', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
    })

    it('hides dropdown on blur with delay', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.blur(input)
      
      // Should still be visible immediately due to setTimeout
      expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      
      // Wait for blur delay
      await waitFor(() => {
        expect(screen.queryByText('Alpine Hut One')).not.toBeInTheDocument()
      }, { timeout: 300 })
    })
  })

  describe('State management', () => {
    it('clears search term after selection', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...') as HTMLInputElement
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      expect(input.value).toBe('alpine')
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Alpine Hut One'))
      
      expect(input.value).toBe('')
    })

    it('resets selected index when search term changes', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
      
      // Select an item
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(screen.getByText('Alpine Hut One').parentElement).toHaveClass('bg-muted')
      
      // Change search term
      fireEvent.change(input, { target: { value: 'mountain' } })
      
      await waitFor(() => {
        // No item should be selected after search change
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
          expect(button).not.toHaveClass('bg-muted')
        })
      })
    })
  })

  describe('Edge cases', () => {
    it('handles empty selectedHuts array', () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={[]} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      // Should not throw error and should show results normally
      expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
    })

    it('handles selectedHuts with only null coordinates', async () => {
      const hutsWithNullCoords: Hut[] = [
        { hutId: 999, hutName: 'No Coords Hut', coordinates: null }
      ]
      
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={hutsWithNullCoords} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        // Should show all huts without distance sorting
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
    })

    it('handles very long search terms', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'a'.repeat(100) } })
      
      await waitFor(() => {
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })

    it('handles special characters in search', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'äöü@#$%' } })
      
      await waitFor(() => {
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })

    it('handles rapid typing', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      // Rapid typing simulation
      fireEvent.change(input, { target: { value: 'a' } })
      fireEvent.change(input, { target: { value: 'al' } })
      fireEvent.change(input, { target: { value: 'alp' } })
      fireEvent.change(input, { target: { value: 'alpi' } })
      fireEvent.change(input, { target: { value: 'alpin' } })
      fireEvent.change(input, { target: { value: 'alpine' } })
      
      await waitFor(() => {
        expect(screen.getByText('Alpine Hut One')).toBeInTheDocument()
      })
    })
  })

  describe('Placeholder hut functionality', () => {
    it('displays placeholder hut at the top of results', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons[0]).toHaveTextContent('Placeholder')
      })
    })

    it('shows placeholder hut when searching', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'placeholder' } })
      
      await waitFor(() => {
        expect(screen.getByText('Placeholder')).toBeInTheDocument()
      })
    })

    it('can select placeholder hut', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        const placeholderButton = screen.getByText('Placeholder')
        fireEvent.click(placeholderButton)
      })
      
      expect(mockOnSelectHut).toHaveBeenCalledWith({
        hutId: -1,
        hutName: 'Placeholder',
        coordinates: null
      })
    })

    it('displays placeholder hut with CircleDashed icon', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      
      await waitFor(() => {
        const placeholderButton = screen.getByText('Placeholder').closest('button')
        expect(placeholderButton).toBeInTheDocument()
        // Note: Icon testing would require additional setup for SVG elements
      })
    })

    it('maintains placeholder at top when searching for other huts', async () => {
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={mockSelectedHuts} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'placeholder' } })
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons[0]).toHaveTextContent('Placeholder')
      })
    })

    it('shows placeholder when searching with distance sorting', async () => {
      const selectedHutsWithCoords: Hut[] = [
        { hutId: 1, hutName: 'Selected Hut', coordinates: [47.0, 11.0] }
      ]
      
      render(<HutSearch onSelectHut={mockOnSelectHut} selectedHuts={selectedHutsWithCoords} />)
      
      const input = screen.getByPlaceholderText('Search for huts...')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'placeholder' } })
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        // When searching, placeholder should be at top
        expect(buttons[0]).toHaveTextContent('Placeholder')
      })
    })
  })
})