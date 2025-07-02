import { describe, it, expect } from 'vitest'
import { TourPlannerService } from './tourPlanner'
import type { Hut, HutAvailability } from '@/types'

// Helper to get test dates within the 4-month range from today
const getTestDates = (dayOffset: number = 10, count: number = 5) => {
  const today = new Date()
  const dates = []
  for (let i = 0; i < count; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset + i)
    dates.push(date.toISOString())
  }
  return dates
}

describe('TourPlannerService', () => {
  const createMockHuts = (count: number): Hut[] => 
    Array.from({ length: count }, (_, i) => ({
      hutId: i + 1,
      hutName: `Hut ${i + 1}`,
      coordinates: [0, 0] as [number, number]
    }))

  const createAvailability = (date: string, options: Partial<HutAvailability> = {}): HutAvailability => ({
    date,
    dateFormatted: date.split('T')[0].split('-').reverse().join('.'),
    hutStatus: 'SERVICED',
    percentage: 'AVAILABLE',
    freeBeds: 10,
    freeBedsPerCategory: {},
    totalSleepingPlaces: 20,
    ...options
  })

  describe('Basic functionality', () => {
    it('returns empty array when no huts provided', () => {
      const result = TourPlannerService.findAvailableTourDates([], {})
      expect(result).toEqual([])
    })

    it('generates tour options for date range when huts have no availability data', () => {
      const huts = createMockHuts(2)
      const result = TourPlannerService.findAvailableTourDates(huts, {})
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      expect(result[0].minAvailableBeds).toBe(0) // No availability data
      expect(result[0].hutAvailabilities[0].availability).toBeNull()
    })

    it('generates tour options for date range regardless of which hut has availability data', () => {
      const huts = createMockHuts(2)
      const [testDate] = getTestDates()
      const availability = {
        2: [createAvailability(testDate)]
      }
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      // Should find the date with actual availability data
      const availableDate = result.find(tour => 
        tour.hutAvailabilities[1].availability?.date === testDate
      )
      expect(availableDate).toBeDefined()
    })
  })

  describe('Single hut tours', () => {
    it('finds available dates for single hut within date range', () => {
      const huts = createMockHuts(1)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [
          createAvailability(date1, { freeBeds: 15 }),
          createAvailability(date2, { freeBeds: 8 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      
      // Find the specific dates with availability data
      const tour1 = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1 &&
        tour.hutAvailabilities[0].availability?.freeBeds === 15
      )
      const tour2 = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date2 &&
        tour.hutAvailabilities[0].availability?.freeBeds === 8
      )
      
      expect(tour1).toBeDefined()
      expect(tour1!.minAvailableBeds).toBe(15)
      expect(tour2).toBeDefined()
      expect(tour2!.minAvailableBeds).toBe(8)
      expect(result[0].hutAvailabilities).toHaveLength(1)
      expect(result[0].hutAvailabilities[0].hut.hutId).toBe(1)
    })
  })

  describe('Multiple hut consecutive tours', () => {
    it('finds available tour dates for consecutive huts', () => {
      const huts = createMockHuts(2)
      const [date1, date2, date3] = getTestDates()
      const availability = {
        1: [
          createAvailability(date1, { freeBeds: 10 }),
          createAvailability(date2, { freeBeds: 5 })
        ],
        2: [
          createAvailability(date2, { freeBeds: 8 }),
          createAvailability(date3, { freeBeds: 12 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      
      // Find the specific consecutive tour dates
      // Tour 1: Start date1 (hut 1 = 10 beds), date2 (hut 2 = 8 beds) -> min = 8
      const tour1 = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1 &&
        tour.hutAvailabilities[1].availability?.date === date2 &&
        tour.minAvailableBeds === 8
      )
      // Tour 2: Start date2 (hut 1 = 5 beds), date3 (hut 2 = 12 beds) -> min = 5
      const tour2 = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date2 &&
        tour.hutAvailabilities[1].availability?.date === date3 &&
        tour.minAvailableBeds === 5
      )
      
      expect(tour1).toBeDefined()
      expect(tour2).toBeDefined()
      expect(result[0].hutAvailabilities).toHaveLength(2)
      expect(result[0].hutAvailabilities[1].hut.hutId).toBe(2)
    })

    it('handles 3-hut consecutive tours correctly', () => {
      const huts = createMockHuts(3)
      const [date1, date2, date3] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 15 })],
        2: [createAvailability(date2, { freeBeds: 12 })],
        3: [createAvailability(date3, { freeBeds: 10 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      
      // Find the specific 3-hut tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1 &&
        tour.hutAvailabilities[1].availability?.date === date2 &&
        tour.hutAvailabilities[2].availability?.date === date3 &&
        tour.minAvailableBeds === 10 // minimum of 15, 12, 10
      )
      
      expect(tour).toBeDefined()
      expect(tour!.hutAvailabilities).toHaveLength(3)
    })

    it('handles longer tour chains correctly', () => {
      const huts = createMockHuts(5)
      const [date1, date2, date3, date4, date5] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 20 })],
        2: [createAvailability(date2, { freeBeds: 15 })],
        3: [createAvailability(date3, { freeBeds: 10 })],
        4: [createAvailability(date4, { freeBeds: 5 })],
        5: [createAvailability(date5, { freeBeds: 8 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      
      // Find the specific 5-hut tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1 &&
        tour.minAvailableBeds === 5 // minimum of 20, 15, 10, 5, 8
      )
      
      expect(tour).toBeDefined()
      expect(tour!.hutAvailabilities).toHaveLength(5)
    })
  })

  describe('Unavailable scenarios', () => {
    it('handles missing availability data for middle hut', () => {
      const huts = createMockHuts(3)
      const [date1, , date3] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 10 })],
        3: [createAvailability(date3, { freeBeds: 15 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result.length).toBeGreaterThan(100) // ~4 months of dates
      
      // Find tour starting date1 - should have null availability for middle hut
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(0) // Middle hut has no data
      expect(tour!.hutAvailabilities[1].availability).toBeNull()
    })

    it('handles full huts (percentage = FULL)', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 10 })],
        2: [createAvailability(date2, { percentage: 'FULL', freeBeds: 0 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(0) // FULL hut has 0 available beds
    })

    it('handles closed huts (hutStatus = CLOSED)', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 10 })],
        2: [createAvailability(date2, { hutStatus: 'CLOSED', freeBeds: 5 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(0) // CLOSED hut has 0 available beds
    })

    it('handles not serviced huts (hutStatus = NOT_SERVICED)', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 10 })],
        2: [createAvailability(date2, { hutStatus: 'NOT_SERVICED', freeBeds: 5 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(0) // NOT_SERVICED hut has 0 available beds
    })
  })

  describe('Edge cases for bed availability', () => {
    it('handles null freeBeds correctly', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 10 })],
        2: [createAvailability(date2, { freeBeds: null as unknown as number })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(0) // null freeBeds treated as 0
    })

    it('handles zero freeBeds', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 10 })],
        2: [createAvailability(date2, { freeBeds: 0 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(0)
    })

    it('calculates minimum beds correctly across all huts', () => {
      const huts = createMockHuts(4)
      const [date1, date2, date3, date4] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { freeBeds: 20 })],
        2: [createAvailability(date2, { freeBeds: 5 })],
        3: [createAvailability(date3, { freeBeds: 15 })],
        4: [createAvailability(date4, { freeBeds: 10 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.minAvailableBeds).toBe(5) // minimum of 20, 5, 15, 10
    })
  })

  describe('Result sorting', () => {
    it('sorts results by start date in ascending order', () => {
      const huts = createMockHuts(1)
      const [date1, date2, date3] = getTestDates()
      const availability = {
        1: [
          createAvailability(date3, { freeBeds: 5 }),
          createAvailability(date1, { freeBeds: 10 }),
          createAvailability(date2, { freeBeds: 8 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Results should be sorted chronologically
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startDate.getTime()).toBeGreaterThanOrEqual(result[i - 1].startDate.getTime())
      }
    })
  })

  describe('Data integrity', () => {
    it('preserves original hut data in results', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1)],
        2: [createAvailability(date2)]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result[0].hutAvailabilities[0].hut).toEqual(huts[0])
      expect(result[0].hutAvailabilities[1].hut).toEqual(huts[1])
    })

    it('includes correct availability data in results', () => {
      const huts = createMockHuts(2)
      const [date1, date2] = getTestDates()
      const availability = {
        1: [createAvailability(date1, { percentage: 'NEARLY FULL' })],
        2: [createAvailability(date2, { hutStatus: 'CLOSED' })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      // Find tour starting date1
      const tour = result.find(tour => 
        tour.hutAvailabilities[0].availability?.date === date1
      )
      
      expect(tour).toBeDefined()
      expect(tour!.hutAvailabilities[0].availability?.percentage).toBe('NEARLY FULL')
      expect(tour!.hutAvailabilities[1].availability?.hutStatus).toBe('CLOSED')
    })
  })
})