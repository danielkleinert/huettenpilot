import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalendarUtils } from './useCalendarUtils'
import type { TourOption, Hut, HutAvailability } from '@/types'

describe('useCalendarUtils', () => {
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

  const mockAvailability: HutAvailability = {
    date: '2024-07-15',
    dateFormatted: '15.07.2024',
    freeBeds: 10,
    hutStatus: 'SERVICED',
    freeBedsPerCategory: {},
    totalSleepingPlaces: 20,
    percentage: 'AVAILABLE'
  }

  const tourDate1: TourOption = {
    startDate: new Date(2024, 6, 15), // July 15, 2024
    minAvailableBeds: 8,
    hutAvailabilities: [
      { hut: mockHut1, availability: mockAvailability }
    ]
  }

  const tourDate2: TourOption = {
    startDate: new Date(2024, 6, 20), // July 20, 2024
    minAvailableBeds: 5,
    hutAvailabilities: [
      { hut: mockHut2, availability: mockAvailability }
    ]
  }

  const tourDate3: TourOption = {
    startDate: new Date(2024, 7, 1), // August 1, 2024
    minAvailableBeds: 3,
    hutAvailabilities: [
      { hut: mockHut1, availability: mockAvailability }
    ]
  }

  describe('getTourOptionForDay', () => {
    it('returns null for null input', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1]))
      
      const tourDate = result.current.getTourOptionForDay(null)
      expect(tourDate).toBeNull()
    })

    it('returns null when no tour date matches the given day', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 16)) // July 16
      expect(tourDate).toBeNull()
    })

    it('returns correct tour date when day matches start date', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1, tourDate2]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 15)) // July 15
      expect(tourDate).toBe(tourDate1)
      expect(tourDate?.minAvailableBeds).toBe(8)
    })

    it('returns correct tour date from multiple options', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1, tourDate2, tourDate3]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 20)) // July 20
      expect(tourDate).toBe(tourDate2)
      expect(tourDate?.minAvailableBeds).toBe(5)
    })

    it('matches exact date components (year, month, day)', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate3]))
      
      // August 1, 2024
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 7, 1))
      expect(tourDate).toBe(tourDate3)
    })

    it('does not match different years', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1]))
      
      // July 15, 2025 (different year)
      const tourDate = result.current.getTourOptionForDay(new Date(2025, 6, 15))
      expect(tourDate).toBeNull()
    })

    it('does not match different months', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1]))
      
      // August 15, 2024 (different month)
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 7, 15))
      expect(tourDate).toBeNull()
    })

    it('does not match different days', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1]))
      
      // July 14, 2024 (different day)
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 14))
      expect(tourDate).toBeNull()
    })

    it('handles empty tour dates array', () => {
      const { result } = renderHook(() => useCalendarUtils([]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 15))
      expect(tourDate).toBeNull()
    })

    it('returns first match when multiple tour dates have same start date', () => {
      const duplicateDateTour: TourOption = {
        startDate: new Date(2024, 6, 15), // Same date as tourDate1
        minAvailableBeds: 12,
        hutAvailabilities: [
          { hut: mockHut2, availability: mockAvailability }
        ]
      }

      const { result } = renderHook(() => useCalendarUtils([tourDate1, duplicateDateTour]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 15))
      expect(tourDate).toBe(tourDate1) // Should return first match
      expect(tourDate?.minAvailableBeds).toBe(8)
    })

    it('handles dates with different times but same day', () => {
      const { result } = renderHook(() => useCalendarUtils([tourDate1]))
      
      // Same date but different time
      const queryDate = new Date(2024, 6, 15, 14, 30, 45)
      const tourDate = result.current.getTourOptionForDay(queryDate)
      
      expect(tourDate).toBe(tourDate1)
    })

    it('handles leap year dates correctly', () => {
      const leapYearTourOption: TourOption = {
        startDate: new Date(2024, 1, 29), // February 29, 2024 (leap year)
        minAvailableBeds: 6,
        hutAvailabilities: [
          { hut: mockHut1, availability: mockAvailability }
        ]
      }

      const { result } = renderHook(() => useCalendarUtils([leapYearTourOption]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 1, 29))
      expect(tourDate).toBe(leapYearTourOption)
    })

    it('handles edge case dates (end of month)', () => {
      const endOfMonthTourOption: TourOption = {
        startDate: new Date(2024, 11, 31), // December 31, 2024
        minAvailableBeds: 4,
        hutAvailabilities: [
          { hut: mockHut1, availability: mockAvailability }
        ]
      }

      const { result } = renderHook(() => useCalendarUtils([endOfMonthTourOption]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 11, 31))
      expect(tourDate).toBe(endOfMonthTourOption)
    })

    it('handles beginning of year dates', () => {
      const newYearTourOption: TourOption = {
        startDate: new Date(2024, 0, 1), // January 1, 2024
        minAvailableBeds: 7,
        hutAvailabilities: [
          { hut: mockHut1, availability: mockAvailability }
        ]
      }

      const { result } = renderHook(() => useCalendarUtils([newYearTourOption]))
      
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 0, 1))
      expect(tourDate).toBe(newYearTourOption)
    })
  })

  describe('Hook behavior', () => {
    it('provides consistent function behavior across renders', () => {
      const { result, rerender } = renderHook(
        ({ tourDates }) => useCalendarUtils(tourDates),
        { initialProps: { tourDates: [tourDate1] } }
      )
      
      const firstGetTourOptionForDay = result.current.getTourOptionForDay
      
      rerender({ tourDates: [tourDate1] }) // Same data
      
      const secondGetTourOptionForDay = result.current.getTourOptionForDay
      
      // Function behavior should be consistent even if references differ
      expect(firstGetTourOptionForDay(new Date(2024, 6, 15))).toEqual(
        secondGetTourOptionForDay(new Date(2024, 6, 15))
      )
    })

    it('updates when tour dates change', () => {
      const { result, rerender } = renderHook(
        ({ tourDates }) => useCalendarUtils(tourDates),
        { initialProps: { tourDates: [tourDate1] } }
      )
      
      let tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 20))
      expect(tourDate).toBeNull()
      
      rerender({ tourDates: [tourDate1, tourDate2] })
      
      tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 20))
      expect(tourDate).toBe(tourDate2)
    })

    it('handles tour dates being removed', () => {
      const { result, rerender } = renderHook(
        ({ tourDates }) => useCalendarUtils(tourDates),
        { initialProps: { tourDates: [tourDate1, tourDate2] } }
      )
      
      let tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 15))
      expect(tourDate).toBe(tourDate1)
      
      rerender({ tourDates: [tourDate2] }) // Remove tourDate1
      
      tourDate = result.current.getTourOptionForDay(new Date(2024, 6, 15))
      expect(tourDate).toBeNull()
    })
  })

  describe('Performance considerations', () => {
    it('handles large arrays of tour dates efficiently', () => {
      const largeTourOptionsArray: TourOption[] = []
      
      // Create 1000 tour dates
      for (let i = 0; i < 1000; i++) {
        largeTourOptionsArray.push({
          startDate: new Date(2024, 0, i + 1),
          minAvailableBeds: i % 10,
          hutAvailabilities: [
            { hut: mockHut1, availability: mockAvailability }
          ]
        })
      }
      
      const { result } = renderHook(() => useCalendarUtils(largeTourOptionsArray))
      
      // Should find the correct tour date quickly
      const startTime = performance.now()
      const tourDate = result.current.getTourOptionForDay(new Date(2024, 0, 500))
      const endTime = performance.now()
      
      expect(tourDate).toBeTruthy()
      expect(tourDate?.minAvailableBeds).toBe(499 % 10)
      expect(endTime - startTime).toBeLessThan(10) // Should be very fast
    })
  })
})