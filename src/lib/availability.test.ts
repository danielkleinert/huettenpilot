import { describe, it, expect } from 'vitest'
import { 
  AvailabilityStatus, 
  getAvailabilityStatus, 
  getAvailabilityColorClass,
  getAvailabilityColorClassForBeds
} from './availability'

describe('availability utilities', () => {
  describe('AvailabilityStatus constants', () => {
    it('has correct status values', () => {
      expect(AvailabilityStatus.GOOD).toBe('good')
      expect(AvailabilityStatus.LIMITED).toBe('limited')
      expect(AvailabilityStatus.NONE).toBe('none')
    })
  })

  describe('getAvailabilityStatus', () => {
    describe('when availableBeds is null', () => {
      it('returns NONE status', () => {
        expect(getAvailabilityStatus(null, 4)).toBe(AvailabilityStatus.NONE)
        expect(getAvailabilityStatus(null, 1)).toBe(AvailabilityStatus.NONE)
        expect(getAvailabilityStatus(null, 10)).toBe(AvailabilityStatus.NONE)
      })
    })

    describe('when availableBeds is less than groupSize', () => {
      it('returns NONE status', () => {
        expect(getAvailabilityStatus(3, 4)).toBe(AvailabilityStatus.NONE)
        expect(getAvailabilityStatus(0, 1)).toBe(AvailabilityStatus.NONE)
        expect(getAvailabilityStatus(5, 6)).toBe(AvailabilityStatus.NONE)
      })
    })

    describe('when availableBeds equals groupSize', () => {
      it('returns LIMITED status (no extra beds)', () => {
        expect(getAvailabilityStatus(4, 4)).toBe(AvailabilityStatus.LIMITED)
        expect(getAvailabilityStatus(1, 1)).toBe(AvailabilityStatus.LIMITED)
        expect(getAvailabilityStatus(10, 10)).toBe(AvailabilityStatus.LIMITED)
      })
    })

    describe('when availableBeds is more than groupSize but less than 5 extra', () => {
      it('returns LIMITED status', () => {
        expect(getAvailabilityStatus(5, 4)).toBe(AvailabilityStatus.LIMITED) // 1 extra
        expect(getAvailabilityStatus(6, 4)).toBe(AvailabilityStatus.LIMITED) // 2 extra
        expect(getAvailabilityStatus(7, 4)).toBe(AvailabilityStatus.LIMITED) // 3 extra
        expect(getAvailabilityStatus(8, 4)).toBe(AvailabilityStatus.LIMITED) // 4 extra
        expect(getAvailabilityStatus(3, 2)).toBe(AvailabilityStatus.LIMITED) // 1 extra
        expect(getAvailabilityStatus(6, 2)).toBe(AvailabilityStatus.LIMITED) // 4 extra
      })
    })

    describe('when availableBeds has 5 or more extra beds', () => {
      it('returns GOOD status', () => {
        expect(getAvailabilityStatus(9, 4)).toBe(AvailabilityStatus.GOOD) // 5 extra
        expect(getAvailabilityStatus(10, 4)).toBe(AvailabilityStatus.GOOD) // 6 extra
        expect(getAvailabilityStatus(15, 4)).toBe(AvailabilityStatus.GOOD) // 11 extra
        expect(getAvailabilityStatus(7, 2)).toBe(AvailabilityStatus.GOOD) // 5 extra
        expect(getAvailabilityStatus(20, 1)).toBe(AvailabilityStatus.GOOD) // 19 extra
      })
    })

    describe('edge cases', () => {
      it('handles zero groupSize correctly', () => {
        expect(getAvailabilityStatus(0, 0)).toBe(AvailabilityStatus.LIMITED) // 0 beds needed, 0 available = exactly enough
        expect(getAvailabilityStatus(5, 0)).toBe(AvailabilityStatus.GOOD) // 0 beds needed, 5 available = 5 extra
        expect(getAvailabilityStatus(10, 0)).toBe(AvailabilityStatus.GOOD) // 0 beds needed, 10 available = 10 extra
      })

      it('handles very large numbers', () => {
        expect(getAvailabilityStatus(1000, 100)).toBe(AvailabilityStatus.GOOD) // 900 extra
        expect(getAvailabilityStatus(104, 100)).toBe(AvailabilityStatus.LIMITED) // 4 extra
        expect(getAvailabilityStatus(105, 100)).toBe(AvailabilityStatus.GOOD) // 5 extra
      })

      it('handles negative availableBeds', () => {
        expect(getAvailabilityStatus(-1, 4)).toBe(AvailabilityStatus.NONE)
        expect(getAvailabilityStatus(-10, 2)).toBe(AvailabilityStatus.NONE)
      })
    })
  })

  describe('getAvailabilityColorClass', () => {
    it('returns correct color for GOOD status', () => {
      const color = getAvailabilityColorClass(AvailabilityStatus.GOOD)
      expect(color).toBe('text-green-700 dark:text-green-400')
    })

    it('returns correct color for LIMITED status', () => {
      const color = getAvailabilityColorClass(AvailabilityStatus.LIMITED)
      expect(color).toBe('text-orange-600 dark:text-orange-400')
    })

    it('returns correct color for NONE status', () => {
      const color = getAvailabilityColorClass(AvailabilityStatus.NONE)
      expect(color).toBe('text-card-foreground')
    })

    it('returns default color for unknown status', () => {
      const color = getAvailabilityColorClass('unknown' as unknown as AvailabilityStatus)
      expect(color).toBe('text-card-foreground')
    })
  })

  describe('getAvailabilityColorClassForBeds', () => {
    it('returns correct color for good availability scenario', () => {
      const color = getAvailabilityColorClassForBeds(10, 4) // 6 extra beds
      expect(color).toBe('text-green-700 dark:text-green-400')
    })

    it('returns correct color for limited availability scenario', () => {
      const color = getAvailabilityColorClassForBeds(6, 4) // 2 extra beds
      expect(color).toBe('text-orange-600 dark:text-orange-400')
    })

    it('returns correct color for no availability scenario', () => {
      const color = getAvailabilityColorClassForBeds(2, 4) // insufficient beds
      expect(color).toBe('text-card-foreground')
    })

    it('returns correct color for null beds', () => {
      const color = getAvailabilityColorClassForBeds(null, 4)
      expect(color).toBe('text-card-foreground')
    })

    it('integrates correctly with getAvailabilityStatus', () => {
      // Test that the combined function works as expected
      const testCases = [
        { beds: 15, group: 4, expected: 'text-green-700 dark:text-green-400' },
        { beds: 8, group: 4, expected: 'text-orange-600 dark:text-orange-400' },
        { beds: 3, group: 4, expected: 'text-card-foreground' },
        { beds: null, group: 4, expected: 'text-card-foreground' }
      ]

      testCases.forEach(({ beds, group, expected }) => {
        const color = getAvailabilityColorClassForBeds(beds, group)
        expect(color).toBe(expected)
      })
    })
  })

  describe('Integration tests', () => {
    it('maintains consistency between status and color functions', () => {
      const testScenarios = [
        { beds: 20, group: 4 }, // GOOD
        { beds: 7, group: 4 },  // LIMITED  
        { beds: 2, group: 4 },  // NONE
        { beds: null, group: 4 } // NONE
      ]

      testScenarios.forEach(({ beds, group }) => {
        const status = getAvailabilityStatus(beds, group)
        const directColor = getAvailabilityColorClass(status)
        const combinedColor = getAvailabilityColorClassForBeds(beds, group)
        
        expect(directColor).toBe(combinedColor)
      })
    })

    it('provides semantic meaning that matches UI requirements', () => {
      // These tests encode the business logic requirements
      
      // Good availability: green colors for plenty of beds
      expect(getAvailabilityColorClassForBeds(15, 4)).toContain('green')
      
      // Limited availability: orange colors for just enough beds
      expect(getAvailabilityColorClassForBeds(6, 4)).toContain('orange')
      
      // No availability: neutral colors for insufficient beds
      expect(getAvailabilityColorClassForBeds(2, 4)).toBe('text-card-foreground')
    })

    it('handles real-world scenarios correctly', () => {
      // Scenario: Small group in high-capacity hut
      expect(getAvailabilityStatus(30, 2)).toBe(AvailabilityStatus.GOOD)
      
      // Scenario: Large group in small hut
      expect(getAvailabilityStatus(8, 10)).toBe(AvailabilityStatus.NONE)
      
      // Scenario: Perfect fit with buffer
      expect(getAvailabilityStatus(9, 4)).toBe(AvailabilityStatus.GOOD) // Exactly 5 buffer
      
      // Scenario: Almost full hut
      expect(getAvailabilityStatus(4, 4)).toBe(AvailabilityStatus.LIMITED) // No buffer
      
      // Scenario: Hut closed or no data
      expect(getAvailabilityStatus(null, 2)).toBe(AvailabilityStatus.NONE)
    })
  })
})