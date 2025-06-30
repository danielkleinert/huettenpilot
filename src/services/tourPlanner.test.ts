import { describe, it, expect } from 'vitest'
import { TourPlannerService } from './tourPlanner'
import type { Hut, HutAvailability } from '@/types'

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

    it('returns empty array when huts have no availability data', () => {
      const huts = createMockHuts(2)
      const result = TourPlannerService.findAvailableTourDates(huts, {})
      expect(result).toEqual([])
    })

    it('returns empty array when first hut has no availability data', () => {
      const huts = createMockHuts(2)
      const availability = {
        2: [createAvailability('2024-07-01T00:00:00')]
      }
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      expect(result).toEqual([])
    })
  })

  describe('Single hut tours', () => {
    it('finds available dates for single hut', () => {
      const huts = createMockHuts(1)
      const availability = {
        1: [
          createAvailability('2024-07-01T00:00:00', { freeBeds: 15 }),
          createAvailability('2024-07-02T00:00:00', { freeBeds: 8 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(2)
      expect(result[0].minAvailableBeds).toBe(15)
      expect(result[1].minAvailableBeds).toBe(8)
      expect(result[0].hutAvailabilities).toHaveLength(1)
      expect(result[0].hutAvailabilities[0].hut.hutId).toBe(1)
    })
  })

  describe('Multiple hut consecutive tours', () => {
    it('finds available tour dates for consecutive huts', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [
          createAvailability('2024-07-01T00:00:00', { freeBeds: 10 }),
          createAvailability('2024-07-02T00:00:00', { freeBeds: 5 })
        ],
        2: [
          createAvailability('2024-07-02T00:00:00', { freeBeds: 8 }),
          createAvailability('2024-07-03T00:00:00', { freeBeds: 12 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(2)
      // Tour 1: Start July 1st (hut 1 = 10 beds), July 2nd (hut 2 = 8 beds) -> min = 8
      expect(result[0].minAvailableBeds).toBe(8)
      // Tour 2: Start July 2nd (hut 1 = 5 beds), July 3rd (hut 2 = 12 beds) -> min = 5
      expect(result[1].minAvailableBeds).toBe(5)
      expect(result[0].hutAvailabilities).toHaveLength(2)
      expect(result[0].hutAvailabilities[1].hut.hutId).toBe(2)
    })

    it('handles 3-hut consecutive tours correctly', () => {
      const huts = createMockHuts(3)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 15 })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: 10 })],
        3: [createAvailability('2024-07-03T00:00:00', { freeBeds: 20 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(10)
      expect(result[0].hutAvailabilities).toHaveLength(3)
    })

    it('handles longer tour chains correctly', () => {
      const huts = createMockHuts(5)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 8 })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: 12 })],
        3: [createAvailability('2024-07-03T00:00:00', { freeBeds: 5 })],
        4: [createAvailability('2024-07-04T00:00:00', { freeBeds: 15 })],
        5: [createAvailability('2024-07-05T00:00:00', { freeBeds: 10 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(5)
      expect(result[0].hutAvailabilities).toHaveLength(5)
    })
  })

  describe('Unavailable scenarios', () => {
    it('handles missing availability data for middle hut', () => {
      const huts = createMockHuts(3)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10 })],
        3: [createAvailability('2024-07-03T00:00:00', { freeBeds: 15 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(0)
      expect(result[0].hutAvailabilities[1].availability).toBeNull()
    })

    it('handles full huts (percentage = FULL)', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2024-07-02T00:00:00', { percentage: 'FULL', freeBeds: 0 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(0)
    })

    it('handles closed huts (hutStatus = CLOSED)', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2024-07-02T00:00:00', { hutStatus: 'CLOSED', freeBeds: 5 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(0)
    })

    it('handles not serviced huts (hutStatus = NOT_SERVICED)', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2024-07-02T00:00:00', { hutStatus: 'NOT_SERVICED', freeBeds: 5 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(0)
    })
  })

  describe('Edge cases for bed availability', () => {
    it('handles null freeBeds correctly', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: null })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(0)
    })

    it('handles zero freeBeds', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 5 })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: 0, percentage: 'AVAILABLE' })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(0)
    })

    it('calculates minimum beds correctly across all huts', () => {
      const huts = createMockHuts(4)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 20 })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: 3 })],
        3: [createAvailability('2024-07-03T00:00:00', { freeBeds: 15 })],
        4: [createAvailability('2024-07-04T00:00:00', { freeBeds: 8 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(3)
    })
  })

  describe('Date handling', () => {
    it('handles dates with different time formats correctly', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T12:30:45.123Z', { freeBeds: 10 })],
        2: [createAvailability('2024-07-02T00:00:00.000Z', { freeBeds: 8 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(8)
    })

    it('handles month and day boundaries correctly', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-31T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2024-08-01T00:00:00', { freeBeds: 8 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(8)
    })

    it('handles year boundaries correctly', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-12-31T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2025-01-01T00:00:00', { freeBeds: 8 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(1)
      expect(result[0].minAvailableBeds).toBe(8)
    })
  })

  describe('Result sorting', () => {
    it('sorts results by start date in ascending order', () => {
      const huts = createMockHuts(1)
      const availability = {
        1: [
          createAvailability('2024-07-03T00:00:00', { freeBeds: 8 }),
          createAvailability('2024-07-01T00:00:00', { freeBeds: 10 }),
          createAvailability('2024-07-02T00:00:00', { freeBeds: 5 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(3)
      expect(result[0].startDate.getTime()).toBeLessThan(result[1].startDate.getTime())
      expect(result[1].startDate.getTime()).toBeLessThan(result[2].startDate.getTime())
      expect(result[0].minAvailableBeds).toBe(10)
      expect(result[1].minAvailableBeds).toBe(5)
      expect(result[2].minAvailableBeds).toBe(8)
    })
  })

  describe('Complex scenarios', () => {
    it('handles mixed availability patterns correctly', () => {
      const huts = createMockHuts(3)
      const availability = {
        1: [
          createAvailability('2024-07-01T00:00:00', { freeBeds: 10 }),
          createAvailability('2024-07-05T00:00:00', { freeBeds: 8 })
        ],
        2: [
          createAvailability('2024-07-02T00:00:00', { freeBeds: 15 }),
          createAvailability('2024-07-06T00:00:00', { freeBeds: 5 })
        ],
        3: [
          createAvailability('2024-07-03T00:00:00', { freeBeds: 12 }),
          createAvailability('2024-07-07T00:00:00', { freeBeds: 20 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(2)
      expect(result[0].minAvailableBeds).toBe(10)
      expect(result[1].minAvailableBeds).toBe(5)
    })

    it('handles overlapping availability windows', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [
          createAvailability('2024-07-01T00:00:00', { freeBeds: 10 }),
          createAvailability('2024-07-02T00:00:00', { freeBeds: 8 }),
          createAvailability('2024-07-03T00:00:00', { freeBeds: 12 })
        ],
        2: [
          createAvailability('2024-07-02T00:00:00', { freeBeds: 15 }),
          createAvailability('2024-07-03T00:00:00', { freeBeds: 5 }),
          createAvailability('2024-07-04T00:00:00', { freeBeds: 20 })
        ]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result).toHaveLength(3)
      // Tour 1: Start July 1st (hut 1 = 10), July 2nd (hut 2 = 15) -> min = 10
      expect(result[0].minAvailableBeds).toBe(10)
      // Tour 2: Start July 2nd (hut 1 = 8), July 3rd (hut 2 = 5) -> min = 5
      expect(result[1].minAvailableBeds).toBe(5)
      // Tour 3: Start July 3rd (hut 1 = 12), July 4th (hut 2 = 20) -> min = 12
      expect(result[2].minAvailableBeds).toBe(12)
    })
  })

  describe('Data integrity', () => {
    it('preserves original hut data in results', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10 })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: 8 })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result[0].hutAvailabilities[0].hut).toEqual(huts[0])
      expect(result[0].hutAvailabilities[1].hut).toEqual(huts[1])
      // The service uses the original hut objects, not clones
      expect(result[0].hutAvailabilities[0].hut).toBe(huts[0])
    })

    it('includes correct availability data in results', () => {
      const huts = createMockHuts(2)
      const availability = {
        1: [createAvailability('2024-07-01T00:00:00', { freeBeds: 10, percentage: 'NEARLY FULL' })],
        2: [createAvailability('2024-07-02T00:00:00', { freeBeds: 8, hutStatus: 'SERVICED' })]
      }
      
      const result = TourPlannerService.findAvailableTourDates(huts, availability)
      
      expect(result[0].hutAvailabilities[0].availability?.percentage).toBe('NEARLY FULL')
      expect(result[0].hutAvailabilities[1].availability?.hutStatus).toBe('SERVICED')
    })
  })
})