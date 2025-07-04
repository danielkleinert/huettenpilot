import type { Hut, HutAvailability, TourOption } from '@/types'

export class TourPlannerService {
  static findAvailableTourDates(
    huts: Hut[],
    availabilityData: Record<number, HutAvailability[]>
  ): TourOption[] {
    if (huts.length === 0) return []

    const allDates: TourOption[] = []
    
    const today = new Date()
    const endDate = new Date(today)
    endDate.setMonth(today.getMonth() + 4)
    endDate.setDate(endDate.getDate() + huts.length)
    
    const currentDate = new Date(today)
    while (currentDate <= endDate) {
      const tourDateResult = this.getAvailabilityForAllHuts(
        huts,
        availabilityData,
        new Date(currentDate)
      )
      
      allDates.push(tourDateResult)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return allDates.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }

  private static getAvailabilityForAllHuts(
    huts: Hut[],
    availabilityData: Record<number, HutAvailability[]>,
    startDate: Date
  ): TourOption {
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
        if (hut.hutId >= 0) {
          minAvailableBeds = 0
        }
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