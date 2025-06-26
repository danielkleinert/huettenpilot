import type { Hut, HutAvailability, TourDate } from '@/types'

export class TourPlannerService {
  static findAvailableTourDates(
    huts: Hut[],
    availabilityData: Record<number, HutAvailability[]>,
    requiredBeds: number
  ): TourDate[] {
    if (huts.length === 0) return []

    const availableDates: TourDate[] = []
    const firstHutAvailability = availabilityData[huts[0].hutId] || []
    for (const startDay of firstHutAvailability) {
      if (!this.hasEnoughBeds(startDay, requiredBeds)) continue
      
      const startDate = new Date(startDay.date)
      const tourDateResult = this.checkConsecutiveAvailability(
        huts,
        availabilityData,
        startDate,
        requiredBeds
      )
      
      if (tourDateResult) {
        availableDates.push(tourDateResult)
      }
    }
    
    return availableDates.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }

  private static checkConsecutiveAvailability(
    huts: Hut[],
    availabilityData: Record<number, HutAvailability[]>,
    startDate: Date,
    requiredBeds: number
  ): TourDate | null {
    const hutAvailabilities: Array<{
      hut: Hut
      availability: HutAvailability
    }> = []

    for (let i = 0; i < huts.length; i++) {
      const hut = huts[i]
      const targetDate = new Date(startDate)
      targetDate.setDate(startDate.getDate() + i)
      
      const hutAvailability = availabilityData[hut.hutId] || []
      const dayAvailability = hutAvailability.find(day => {
        const dayDate = new Date(day.date)
        return this.isSameDay(dayDate, targetDate)
      })
      
      if (!dayAvailability || !this.hasEnoughBeds(dayAvailability, requiredBeds)) {
        return null
      }
      
      hutAvailabilities.push({
        hut,
        availability: dayAvailability
      })
    }
    
    return {
      startDate,
      hutAvailabilities
    }
  }

  private static hasEnoughBeds(availability: HutAvailability, requiredBeds: number): boolean {
    return availability.freeBeds >= requiredBeds && 
           availability.hutStatus === 'SERVICED' &&
           availability.percentage !== 'FULL'
  }

  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

}