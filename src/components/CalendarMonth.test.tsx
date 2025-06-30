import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { CalendarMonth } from './CalendarMonth'
import type { TourDate, Hut, HutAvailability } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'calendar.months.january': 'January',
        'calendar.months.february': 'February',
        'calendar.months.march': 'March',
        'calendar.months.april': 'April',
        'calendar.months.may': 'May',
        'calendar.months.june': 'June',
        'calendar.months.july': 'July',
        'calendar.months.august': 'August',
        'calendar.months.september': 'September',
        'calendar.months.october': 'October',
        'calendar.months.november': 'November',
        'calendar.months.december': 'December',
        'calendar.days.monday': 'Mon',
        'calendar.days.tuesday': 'Tue',
        'calendar.days.wednesday': 'Wed',
        'calendar.days.thursday': 'Thu',
        'calendar.days.friday': 'Fri',
        'calendar.days.saturday': 'Sat',
        'calendar.days.sunday': 'Sun'
      }
      return translations[key] || key
    }
  })
}))

describe('CalendarMonth', () => {
  const mockHut: Hut = {
    hutId: 1,
    hutName: 'Test Hut',
    coordinates: [47.0, 11.0]
  }

  const mockAvailability: HutAvailability = {
    date: '2024-07-15',
    dateFormatted: '15.07.2024',
    freeBeds: 10,
    hutStatus: 'SERVICED',
    freeBedsPerCategory: {},
    totalSleepingPlaces: 20,
    percentage: 'AVAILABLE'
  }

  const mockTourDate: TourDate = {
    startDate: new Date(2025, 6, 15), // July 15, 2025 (future date)
    minAvailableBeds: 8,
    hutAvailabilities: [
      { hut: mockHut, availability: mockAvailability }
    ]
  }

  const mockGetTourDateForDay = vi.fn()
  const mockOnDateClick = vi.fn()
  const mockOnDateHover = vi.fn()

  const defaultProps = {
    month: new Date(2025, 6, 1), // July 2025 (future date)
    groupSize: 4,
    hoveredDate: null as Date | null,
    onDateClick: mockOnDateClick,
    onDateHover: mockOnDateHover,
    getTourDateForDay: mockGetTourDateForDay
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTourDateForDay.mockReturnValue(null)
  })

  describe('Basic rendering', () => {
    it('renders month title correctly', () => {
      render(<CalendarMonth {...defaultProps} />)
      expect(screen.getByText('July 2025')).toBeInTheDocument()
    })

    it('renders all day names', () => {
      render(<CalendarMonth {...defaultProps} />)
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Wed')).toBeInTheDocument()
      expect(screen.getByText('Thu')).toBeInTheDocument()
      expect(screen.getByText('Fri')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
      expect(screen.getByText('Sun')).toBeInTheDocument()
    })

    it('renders correct number of days for July 2025', () => {
      render(<CalendarMonth {...defaultProps} />)
      // July has 31 days
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('31')).toBeInTheDocument()
      expect(screen.queryByText('32')).not.toBeInTheDocument()
    })

    it('renders February with correct days in leap year', () => {
      const febLeapYear = new Date(2024, 1, 1) // February 2024 (leap year)
      render(<CalendarMonth {...defaultProps} month={febLeapYear} />)
      expect(screen.getByText('29')).toBeInTheDocument()
      expect(screen.queryByText('30')).not.toBeInTheDocument()
    })

    it('renders February with correct days in non-leap year', () => {
      const febNonLeapYear = new Date(2023, 1, 1) // February 2023 (non-leap year)
      render(<CalendarMonth {...defaultProps} month={febNonLeapYear} />)
      expect(screen.getByText('28')).toBeInTheDocument()
      expect(screen.queryByText('29')).not.toBeInTheDocument()
    })
  })

  describe('Date interactions', () => {
    it('calls onDateClick when clicking on a date', () => {
      render(<CalendarMonth {...defaultProps} />)
      const dateElement = screen.getByText('15')
      fireEvent.click(dateElement)
      
      expect(mockOnDateClick).toHaveBeenCalledWith(new Date(2025, 6, 15))
    })

    it('calls onDateHover when hovering over a date with tour data', () => {
      mockGetTourDateForDay.mockReturnValue(mockTourDate)
      
      render(<CalendarMonth {...defaultProps} />)
      const dateElement = screen.getByText('15')
      fireEvent.mouseEnter(dateElement)
      
      expect(mockOnDateHover).toHaveBeenCalledWith(new Date(2025, 6, 15))
    })

    it('does not call onDateHover when hovering over date without tour data', () => {
      mockGetTourDateForDay.mockReturnValue(null)
      
      render(<CalendarMonth {...defaultProps} />)
      const dateElement = screen.getByText('15')
      fireEvent.mouseEnter(dateElement)
      
      expect(mockOnDateHover).not.toHaveBeenCalled()
    })

    it('calls onDateHover with null when mouse leaves', () => {
      render(<CalendarMonth {...defaultProps} />)
      const dateElement = screen.getByText('15')
      fireEvent.mouseLeave(dateElement)
      
      expect(mockOnDateHover).toHaveBeenCalledWith(null)
    })

    it('prevents event bubbling on date click', () => {
      const parentClickHandler = vi.fn()
      render(
        <div onClick={parentClickHandler}>
          <CalendarMonth {...defaultProps} />
        </div>
      )
      
      const dateElement = screen.getByText('15')
      fireEvent.click(dateElement)
      
      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('Date styling and highlighting', () => {
    it('highlights today with special styling', () => {
      const today = new Date()
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      render(<CalendarMonth {...defaultProps} month={currentMonth} />)
      
      const todayElement = screen.getByText(today.getDate().toString())
      expect(todayElement.parentElement).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30')
    })

    it('applies past date styling for dates before today', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayMonth = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1)
      
      render(<CalendarMonth {...defaultProps} month={yesterdayMonth} />)
      
      const yesterdayElement = screen.getByText(yesterday.getDate().toString())
      expect(yesterdayElement.parentElement).toHaveClass('text-muted-foreground')
    })

    it('applies availability color for dates with tour data', () => {
      mockGetTourDateForDay.mockReturnValue(mockTourDate)
      
      render(<CalendarMonth {...defaultProps} />)
      
      const dateElement = screen.getByText('15')
      // 8 beds for group of 4 = limited availability (4 extra beds, less than 5)
      expect(dateElement.parentElement).toHaveClass('text-orange-600')
    })

    it('applies font-medium for dates with sufficient availability', () => {
      const tourDateWithGoodAvailability = {
        ...mockTourDate,
        minAvailableBeds: 10 // More than groupSize (4)
      }
      mockGetTourDateForDay.mockReturnValue(tourDateWithGoodAvailability)
      
      render(<CalendarMonth {...defaultProps} />)
      
      const dateElement = screen.getByText('15')
      expect(dateElement.parentElement).toHaveClass('font-medium')
    })

    it('highlights dates in tour duration when date is hovered', () => {
      const hoveredDate = new Date(2025, 6, 15)
      const tourDate = {
        ...mockTourDate,
        hutAvailabilities: [
          { hut: mockHut, availability: mockAvailability },
          { hut: mockHut, availability: { ...mockAvailability, date: '2025-07-16' } }
        ]
      }
      
      mockGetTourDateForDay.mockImplementation((date) => {
        if (date && date.getDate() === 15) return tourDate
        return null
      })
      
      render(<CalendarMonth {...defaultProps} hoveredDate={hoveredDate} />)
      
      // Both day 15 and 16 should be highlighted (2-day tour)
      const day15 = screen.getByText('15')
      const day16 = screen.getByText('16')
      
      expect(day15.parentElement).toHaveClass('bg-muted')
      expect(day16.parentElement).toHaveClass('bg-muted')
    })
  })

  describe('Calendar layout', () => {
    it('handles months that start on different weekdays', () => {
      // Test a month that starts on Sunday (should have 6 empty cells before)
      const monthStartingSunday = new Date(2024, 8, 1) // September 2024 starts on Sunday
      render(<CalendarMonth {...defaultProps} month={monthStartingSunday} />)
      
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
    })

    it('creates proper grid structure', () => {
      const { container } = render(<CalendarMonth {...defaultProps} />)
      
      const dayHeaders = container.querySelectorAll('.grid-cols-7')[0]
      const dayGrid = container.querySelectorAll('.grid-cols-7')[1]
      
      expect(dayHeaders).toBeInTheDocument()
      expect(dayGrid).toBeInTheDocument()
    })
  })

  describe('Utility function calls', () => {
    it('calls getTourDateForDay for each rendered date', () => {
      render(<CalendarMonth {...defaultProps} />)
      
      // Should be called for each day in July (31 days) plus some empty cells
      expect(mockGetTourDateForDay).toHaveBeenCalled()
      
      // Verify it's called with actual dates
      expect(mockGetTourDateForDay).toHaveBeenCalledWith(new Date(2025, 6, 1))
      expect(mockGetTourDateForDay).toHaveBeenCalledWith(new Date(2025, 6, 15))
      expect(mockGetTourDateForDay).toHaveBeenCalledWith(new Date(2025, 6, 31))
    })

    it('applies correct styling based on availability status', () => {
      mockGetTourDateForDay.mockReturnValue(mockTourDate)
      
      render(<CalendarMonth {...defaultProps} />)
      
      const dateElement = screen.getByText('15')
      // Should have good availability color class (8 beds for group of 4 = limited)
      expect(dateElement.parentElement).toHaveClass('text-orange-600')
    })
  })

  describe('Edge cases', () => {
    it('handles empty calendar cells correctly', () => {
      const { container } = render(<CalendarMonth {...defaultProps} />)
      
      // Empty cells should not have text content - look for calendar-date cells specifically
      const calendarCells = container.querySelectorAll('.calendar-date')
      const emptyCells = Array.from(calendarCells).filter(cell => {
        const span = cell.querySelector('span')
        return !span || !span.textContent?.trim()
      })
      expect(emptyCells.length).toBeGreaterThan(0)
    })

    it('handles different group sizes', () => {
      mockGetTourDateForDay.mockReturnValue(mockTourDate)
      
      render(<CalendarMonth {...defaultProps} groupSize={8} />)
      
      const dateElement = screen.getByText('15')
      // 8 beds for group of 8 = exactly enough (limited status)
      expect(dateElement.parentElement).toHaveClass('text-orange-600')
    })

    it('works with different months and years', () => {
      const differentMonth = new Date(2025, 11, 1) // December 2025
      render(<CalendarMonth {...defaultProps} month={differentMonth} />)
      
      expect(screen.getByText('December 2025')).toBeInTheDocument()
    })

    it('handles tour dates with no availability data', () => {
      const tourDateWithoutAvailability = {
        ...mockTourDate,
        minAvailableBeds: undefined as unknown as number
      }
      mockGetTourDateForDay.mockReturnValue(tourDateWithoutAvailability)
      
      render(<CalendarMonth {...defaultProps} />)
      
      const dateElement = screen.getByText('15')
      expect(dateElement.parentElement).toHaveClass('text-card-foreground')
    })
  })
})