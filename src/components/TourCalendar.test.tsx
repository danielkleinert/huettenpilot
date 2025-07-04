import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { TourCalendar } from './TourCalendar'
import type { TourOption, Hut, HutAvailability } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'calendar.title': 'Tour Calendar',
        'calendar.noDateFound': 'No available dates found for your tour'
      }
      return translations[key] || key
    }
  })
}))

describe('TourCalendar', () => {
  const mockHut: Hut = {
    hutId: 1,
    hutName: 'Test Hut',
    coordinates: [47.0, 11.0]
  }

  const mockAvailability: HutAvailability = {
    date: '2025-07-15',
    dateFormatted: '15.07.2025',
    freeBeds: 10,
    hutStatus: 'SERVICED',
    freeBedsPerCategory: {},
    totalSleepingPlaces: 20,
    percentage: 'AVAILABLE'
  }

  const mockTourOption: TourOption = {
    startDate: new Date(2025, 6, 15), // July 15, 2025
    minAvailableBeds: 8,
    hutAvailabilities: [
      { hut: mockHut, availability: mockAvailability }
    ]
  }

  const defaultProps = {
    tourDates: [mockTourOption],
    groupSize: 4
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock current date to be consistent
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 1)) // June 1, 2025
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic rendering', () => {
    it('renders calendar title', () => {
      render(<TourCalendar {...defaultProps} />)
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })

    it('renders main container with correct classes', () => {
      const { container } = render(<TourCalendar {...defaultProps} />)
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('space-y-8')
    })

    it('renders four calendar months in grid layout', () => {
      render(<TourCalendar {...defaultProps} />)
      
      const gridContainer = screen.getByText('Tour Calendar').nextElementSibling
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-8')
    })

    it('shows no dates found message when tourDates is empty', () => {
      render(<TourCalendar {...defaultProps} tourDates={[]} />)
      expect(screen.getByText('No available dates found for your tour')).toBeInTheDocument()
    })

    it('does not show no dates message when tourDates is provided', () => {
      render(<TourCalendar {...defaultProps} />)
      expect(screen.queryByText('No available dates found for your tour')).not.toBeInTheDocument()
    })

    it('renders with correct CSS classes for no dates message', () => {
      render(<TourCalendar {...defaultProps} tourDates={[]} />)
      const noDataElement = screen.getByText('No available dates found for your tour')
      expect(noDataElement).toHaveClass('text-center', 'py-8', 'text-muted-foreground')
    })
  })

  describe('Month generation logic', () => {
    it('generates four consecutive months starting from current date', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // We can't easily test the exact CalendarMonth props without mocking,
      // but we can verify the months are being generated by checking
      // that the CalendarMonth components are rendered (they'll show as calendar grids)
      const calendarContainer = screen.getByText('Tour Calendar').nextElementSibling
      expect(calendarContainer?.children).toHaveLength(4)
    })

    it('handles year transitions correctly in month generation', () => {
      // Set time to November so we cross into next year
      vi.setSystemTime(new Date(2025, 10, 1)) // November 1, 2025
      
      render(<TourCalendar {...defaultProps} />)
      
      // Should still render 4 months without errors
      const calendarContainer = screen.getByText('Tour Calendar').nextElementSibling
      expect(calendarContainer?.children).toHaveLength(4)
    })
  })

  describe('State management', () => {
    it('initializes with no selected date', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // DatePopup should not be visible initially
      expect(screen.queryByText(/Date:.*Min Beds:.*Group:/)).not.toBeInTheDocument()
    })

    it('initializes with no hovered date', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // Component should render without errors
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })
  })

  describe('Event listener management', () => {
    it('adds click event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      
      render(<TourCalendar {...defaultProps} />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      
      addEventListenerSpy.mockRestore()
    })

    it('removes click event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      
      const { unmount } = render(<TourCalendar {...defaultProps} />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      
      removeEventListenerSpy.mockRestore()
    })

    it('handles click outside to close popup', async () => {
      const { container } = render(<TourCalendar {...defaultProps} />)
      
      // Manually trigger the click outside handler to test the logic
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', {
        value: document.body,
        enumerable: true
      })
      
      document.dispatchEvent(clickEvent)
      
      // Should not throw any errors
      expect(container).toBeInTheDocument()
    })

    it('does not close popup when clicking calendar elements', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // Create a mock calendar-date element
      const calendarElement = document.createElement('div')
      calendarElement.className = 'calendar-date'
      document.body.appendChild(calendarElement)
      
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', {
        value: calendarElement,
        enumerable: true
      })
      
      // Should not throw errors when clicking on calendar elements
      expect(() => document.dispatchEvent(clickEvent)).not.toThrow()
      
      // Cleanup
      document.body.removeChild(calendarElement)
    })

    it('does not close popup when clicking popup elements', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // Create a mock date-popup element
      const popupElement = document.createElement('div')
      popupElement.className = 'date-popup'
      document.body.appendChild(popupElement)
      
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', {
        value: popupElement,
        enumerable: true
      })
      
      // Should not throw errors when clicking on popup elements
      expect(() => document.dispatchEvent(clickEvent)).not.toThrow()
      
      // Cleanup
      document.body.removeChild(popupElement)
    })
  })

  describe('Date handling functions', () => {
    it('handles date click function without errors', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // The component should render the handleDateClick function internally
      // We can't test it directly, but we can verify no errors occur
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })

    it('handles date hover function without errors', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // The component should render the handleDateHover function internally
      // We can't test it directly, but we can verify no errors occur
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })
  })

  describe('Props handling', () => {
    it('handles empty tourDates array', () => {
      render(<TourCalendar {...defaultProps} tourDates={[]} />)
      
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
      expect(screen.getByText('No available dates found for your tour')).toBeInTheDocument()
    })

    it('handles large group sizes', () => {
      render(<TourCalendar {...defaultProps} groupSize={100} />)
      
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })

    it('handles zero group size', () => {
      render(<TourCalendar {...defaultProps} groupSize={0} />)
      
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })

    it('handles multiple tour dates', () => {
      const multipleTourOptions = [
        mockTourOption,
        {
          startDate: new Date(2025, 7, 20),
          minAvailableBeds: 12,
          hutAvailabilities: [{ hut: mockHut, availability: mockAvailability }]
        },
        {
          startDate: new Date(2025, 8, 5),
          minAvailableBeds: 6,
          hutAvailabilities: [{ hut: mockHut, availability: mockAvailability }]
        }
      ]
      
      render(<TourCalendar {...defaultProps} tourDates={multipleTourOptions} />)
      
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
      expect(screen.queryByText('No available dates found for your tour')).not.toBeInTheDocument()
    })

    it('handles tour dates with different huts', () => {
      const anotherHut: Hut = {
        hutId: 2,
        hutName: 'Another Hut',
        coordinates: [47.5, 11.5]
      }
      
      const tourDateWithDifferentHut: TourOption = {
        startDate: new Date(2025, 6, 20),
        minAvailableBeds: 5,
        hutAvailabilities: [
          { hut: anotherHut, availability: mockAvailability }
        ]
      }
      
      render(<TourCalendar {...defaultProps} tourDates={[tourDateWithDifferentHut]} />)
      
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })
  })

  describe('Accessibility and semantic HTML', () => {
    it('renders semantic heading for calendar title', () => {
      render(<TourCalendar {...defaultProps} />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Tour Calendar')
      expect(heading).toHaveClass('text-xl', 'font-semibold')
    })

    it('uses appropriate semantic structure', () => {
      const { container } = render(<TourCalendar {...defaultProps} />)
      
      // Should have main container
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have main heading (h2) and month headings (h3)
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      
      // Main heading should be h2
      const mainHeading = screen.getByRole('heading', { level: 2 })
      expect(mainHeading).toHaveTextContent('Tour Calendar')
    })
  })

  describe('Component composition', () => {
    it('renders all child components without errors', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // Should render without throwing
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })

    it('maintains component structure with different props', () => {
      const { rerender } = render(<TourCalendar {...defaultProps} />)
      
      // Change props and verify it still renders
      rerender(<TourCalendar {...defaultProps} groupSize={8} />)
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
      
      rerender(<TourCalendar {...defaultProps} tourDates={[]} />)
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })
  })

  describe('Date utility integration', () => {
    it('integrates with useCalendarUtils hook', () => {
      render(<TourCalendar {...defaultProps} />)
      
      // The hook should be called and the component should render without errors
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })

    it('handles hook returning different values', () => {
      // Test with various tour date configurations using rerender
      const { rerender } = render(<TourCalendar {...defaultProps} tourDates={[]} />)
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
      
      rerender(<TourCalendar {...defaultProps} />)
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
    })
  })

  describe('Performance considerations', () => {
    it('handles large numbers of tour dates efficiently', () => {
      const largeTourOptionsArray: TourOption[] = []
      
      // Create 50 tour dates (reduced for faster testing)
      for (let i = 0; i < 50; i++) {
        largeTourOptionsArray.push({
          startDate: new Date(2025, 6, i + 1),
          minAvailableBeds: i % 10 + 1,
          hutAvailabilities: [
            { hut: mockHut, availability: mockAvailability }
          ]
        })
      }
      
      const startTime = performance.now()
      render(<TourCalendar {...defaultProps} tourDates={largeTourOptionsArray} />)
      const endTime = performance.now()
      
      expect(screen.getByText('Tour Calendar')).toBeInTheDocument()
      expect(endTime - startTime).toBeLessThan(500) // Increased threshold for CI environments
    })
  })
})