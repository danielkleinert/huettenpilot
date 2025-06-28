import type { Hut, HutAvailability, TourDate } from '@/types'

export class TourPlannerService {
  static findAvailableTourDates(
    huts: Hut[],
    availabilityData: Record<number, HutAvailability[]>
  ): TourDate[] {
    if (huts.length === 0) return []

    const allDates: TourDate[] = []
    const firstHutAvailability = availabilityData[huts[0].hutId] || []
    
    for (const startDay of firstHutAvailability) {
      const startDate = new Date(startDay.date)
      const tourDateResult = this.getAvailabilityForAllHuts(
        huts,
        availabilityData,
        startDate
      )
      
      allDates.push(tourDateResult)
    }
    
    return allDates.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }

  private static getAvailabilityForAllHuts(
    huts: Hut[],
    availabilityData: Record<number, HutAvailability[]>,
    startDate: Date
  ): TourDate {
    const hutAvailabilities: Array<{
      hut: Hut
      availability: HutAvailability | null
    }> = []

    let minAvailableBeds = Infinity

    for (let i = 0; i < huts.length; i++) {
      const hut = huts[i]
      const targetDate = new Date(startDate)
      targetDate.setDate(startDate.getDate() + i)
      
      const hutAvailability = availabilityData[hut.hutId] || []
      const dayAvailability = this.findAvailabilityForDate(hutAvailability, targetDate)
      
      if (!dayAvailability) {
        minAvailableBeds = 0
        hutAvailabilities.push({
          hut,
          availability: null
        })
      } else {
        const availableBeds = this.getAvailableBeds(dayAvailability)
        minAvailableBeds = Math.min(minAvailableBeds, availableBeds)
        hutAvailabilities.push({
          hut,
          availability: dayAvailability
        })
      }
    }
    
    return {
      startDate,
      hutAvailabilities,
      minAvailableBeds: minAvailableBeds === Infinity ? 0 : minAvailableBeds
    }
  }

  private static findAvailabilityForDate(
    availabilities: HutAvailability[], 
    targetDate: Date
  ): HutAvailability | null {
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(targetDate.getDate()).padStart(2, '0')
    const targetDateStr = `${year}-${month}-${dayOfMonth}`
    
    return availabilities.find(availability => {
      const apiDate = availability.date.split('T')[0]
      return apiDate === targetDateStr
    }) || null
  }

  private static getAvailableBeds(availability: HutAvailability): number {
    if (availability.hutStatus !== 'SERVICED' || availability.percentage === 'FULL') {
      return 0
    }
    return availability.freeBeds ?? 0
  }

}