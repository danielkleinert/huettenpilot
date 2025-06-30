import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { DatePopup } from './DatePopup'
import type { TourDate, Hut, HutAvailability } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { date?: string; number?: number; count?: number }) => {
      const translations: Record<string, string> = {
        'calendar.tourStarting': `Tour starting on ${options?.date}`,
        'calendar.availabilityFor': `Availability for ${options?.date}`,
        'calendar.day': `Day ${options?.number}`,
        'calendar.closed': 'Closed',
        'calendar.bedsAvailable': `${options?.count} beds available`,
        'calendar.noAvailabilityData': 'No availability data'
      }
      return translations[key] || key
    }
  })
}))

describe('DatePopup', () => {
  const mockHut1: Hut = {
    hutId: 1,
    hutName: 'Alpine Hut',
    coordinates: [47.0, 11.0]
  }

  const mockHut2: Hut = {
    hutId: 2,
    hutName: 'Mountain Hut',
    coordinates: [47.1, 11.1]
  }

  const mockAvailability1: HutAvailability = {
    date: '2024-07-15',
    dateFormatted: '15.07.2024',
    freeBeds: 10,
    hutStatus: 'SERVICED',
    freeBedsPerCategory: {},
    totalSleepingPlaces: 20,
    percentage: 'AVAILABLE'
  }

  const mockAvailability2: HutAvailability = {
    date: '2024-07-16',
    dateFormatted: '16.07.2024',
    freeBeds: 3,
    hutStatus: 'SERVICED',
    freeBedsPerCategory: {},
    totalSleepingPlaces: 15,
    percentage: 'NEARLY FULL'
  }

  const mockTourDate: TourDate = {
    startDate: new Date(2024, 6, 15), // July 15, 2024
    minAvailableBeds: 3,
    hutAvailabilities: [
      { hut: mockHut1, availability: mockAvailability1 },
      { hut: mockHut2, availability: mockAvailability2 }
    ]
  }

  const defaultProps = {
    selectedDate: new Date(2024, 6, 15),
    tourDate: mockTourDate,
    groupSize: 4
  }

  describe('Basic rendering', () => {
    it('renders popup with correct date header for sufficient availability', () => {
      const sufficientTourDate = {
        ...mockTourDate,
        minAvailableBeds: 5
      }
      
      render(<DatePopup {...defaultProps} tourDate={sufficientTourDate} />)
      
      expect(screen.getByText(/Tour starting on/)).toBeInTheDocument()
      expect(screen.getByText(/Mon, Jul 15, 2024/)).toBeInTheDocument()
    })

    it('renders popup with correct date header for insufficient availability', () => {
      render(<DatePopup {...defaultProps} />)
      
      expect(screen.getByText(/Availability for/)).toBeInTheDocument()
      expect(screen.getByText(/Mon, Jul 15, 2024/)).toBeInTheDocument()
    })

    it('renders all huts in tour', () => {
      render(<DatePopup {...defaultProps} />)
      
      expect(screen.getByText('Day 1: Alpine Hut')).toBeInTheDocument()
      expect(screen.getByText('Day 2: Mountain Hut')).toBeInTheDocument()
    })

    it('renders availability information for each hut', () => {
      render(<DatePopup {...defaultProps} />)
      
      expect(screen.getByText('10 beds available')).toBeInTheDocument()
      expect(screen.getByText('3 beds available')).toBeInTheDocument()
    })
  })

  describe('Availability status display', () => {
    it('displays closed status correctly', () => {
      const closedAvailability: HutAvailability = {
        ...mockAvailability1,
        hutStatus: 'CLOSED',
        freeBeds: 0
      }
      
      const tourDateWithClosedHut: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: closedAvailability }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithClosedHut} />)
      
      expect(screen.getByText('Closed')).toBeInTheDocument()
    })

    it('displays no availability data message', () => {
      const tourDateWithNoAvailability: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: null }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithNoAvailability} />)
      
      expect(screen.getByText('No availability data')).toBeInTheDocument()
    })

    it('handles zero beds available', () => {
      const zeroBedsAvailability: HutAvailability = {
        ...mockAvailability1,
        freeBeds: 0
      }
      
      const tourDateWithZeroBeds: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: zeroBedsAvailability }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithZeroBeds} />)
      
      expect(screen.getByText('0 beds available')).toBeInTheDocument()
    })

    it('handles null beds available', () => {
      const nullBedsAvailability: HutAvailability = {
        ...mockAvailability1,
        freeBeds: null
      }
      
      const tourDateWithNullBeds: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: nullBedsAvailability }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithNullBeds} />)
      
      expect(screen.getByText('0 beds available')).toBeInTheDocument()
    })
  })

  describe('Color styling', () => {
    it('applies good availability color for high bed count', () => {
      const highAvailability: HutAvailability = {
        ...mockAvailability1,
        freeBeds: 15 // More than groupSize (4) + 5
      }
      
      const tourDateWithHighAvailability: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: highAvailability }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithHighAvailability} />)
      
      const availabilityText = screen.getByText('15 beds available')
      expect(availabilityText).toHaveClass('text-green-700')
    })

    it('applies limited availability color for medium bed count', () => {
      const limitedAvailability: HutAvailability = {
        ...mockAvailability1,
        freeBeds: 6 // groupSize (4) + 2, less than 5 extra
      }
      
      const tourDateWithLimitedAvailability: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: limitedAvailability }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithLimitedAvailability} />)
      
      const availabilityText = screen.getByText('6 beds available')
      expect(availabilityText).toHaveClass('text-orange-600')
    })

    it('applies no availability color for insufficient beds', () => {
      const insufficientAvailability: HutAvailability = {
        ...mockAvailability1,
        freeBeds: 2 // Less than groupSize (4)
      }
      
      const tourDateWithInsufficientAvailability: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: insufficientAvailability }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithInsufficientAvailability} />)
      
      const availabilityText = screen.getByText('2 beds available')
      expect(availabilityText).toHaveClass('text-card-foreground')
    })

    it('applies muted color for null availability', () => {
      const tourDateWithNullAvailability: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: null }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={tourDateWithNullAvailability} />)
      
      const noDataText = screen.getByText('No availability data')
      expect(noDataText).toHaveClass('text-muted-foreground')
    })
  })

  describe('Event handling', () => {
    it('prevents event bubbling when clicked', () => {
      const parentClickHandler = vi.fn()
      
      render(
        <div onClick={parentClickHandler}>
          <DatePopup {...defaultProps} />
        </div>
      )
      
      const popup = screen.getByText(/Tour starting on|Availability for/).closest('.date-popup')
      fireEvent.click(popup!)
      
      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('Tour determination', () => {
    it('shows tour starting message when minimum beds meet group size', () => {
      const sufficientTourDate: TourDate = {
        ...mockTourDate,
        minAvailableBeds: 4 // Exactly matches groupSize
      }
      
      render(<DatePopup {...defaultProps} tourDate={sufficientTourDate} />)
      
      expect(screen.getByText(/Tour starting on/)).toBeInTheDocument()
    })

    it('shows availability message when minimum beds are insufficient', () => {
      const insufficientTourDate: TourDate = {
        ...mockTourDate,
        minAvailableBeds: 3 // Less than groupSize (4)
      }
      
      render(<DatePopup {...defaultProps} tourDate={insufficientTourDate} />)
      
      expect(screen.getByText(/Availability for/)).toBeInTheDocument()
    })
  })

  describe('Multi-day tours', () => {
    it('renders correct day numbers for multi-day tour', () => {
      const threeDayTour: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: mockAvailability1 },
          { hut: mockHut2, availability: mockAvailability2 },
          { hut: { hutId: 3, hutName: 'Summit Hut', coordinates: [47.2, 11.2] }, availability: mockAvailability1 }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={threeDayTour} />)
      
      expect(screen.getByText('Day 1: Alpine Hut')).toBeInTheDocument()
      expect(screen.getByText('Day 2: Mountain Hut')).toBeInTheDocument()
      expect(screen.getByText('Day 3: Summit Hut')).toBeInTheDocument()
    })

    it('handles single day tour', () => {
      const singleDayTour: TourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut1, availability: mockAvailability1 }
        ]
      }
      
      render(<DatePopup {...defaultProps} tourDate={singleDayTour} />)
      
      expect(screen.getByText('Day 1: Alpine Hut')).toBeInTheDocument()
      expect(screen.queryByText('Day 2')).not.toBeInTheDocument()
    })
  })

  describe('Date formatting', () => {
    it('formats different dates correctly', () => {
      const differentDate = new Date(2024, 11, 25) // December 25, 2024
      
      render(<DatePopup {...defaultProps} selectedDate={differentDate} />)
      
      expect(screen.getByText(/Wed, Dec 25, 2024/)).toBeInTheDocument()
    })

    it('formats different years correctly', () => {
      const futureDate = new Date(2025, 0, 1) // January 1, 2025
      
      render(<DatePopup {...defaultProps} selectedDate={futureDate} />)
      
      expect(screen.getByText(/Wed, Jan 1, 2025/)).toBeInTheDocument()
    })
  })

  describe('Styling and layout', () => {
    it('has correct CSS classes for positioning and appearance', () => {
      render(<DatePopup {...defaultProps} />)
      
      const popup = screen.getByText(/Tour starting on|Availability for/).closest('.date-popup')
      expect(popup).toHaveClass(
        'fixed',
        'bottom-4',
        'right-4',
        'bg-card',
        'border',
        'border-border',
        'text-card-foreground',
        'p-4',
        'rounded-lg',
        'shadow-lg',
        'max-w-sm',
        'z-50',
        'backdrop-blur-sm'
      )
    })
  })
})