import type { TourDate } from '@/types'

export function useCalendarUtils(tourDates: TourDate[]) {
  const getTourDateForDay = (day: Date | null): TourDate | null => {
    if (!day) return null
    
    return tourDates.find(tourDate => {
      const startDate = tourDate.startDate
      return startDate.getFullYear() === day.getFullYear() &&
             startDate.getMonth() === day.getMonth() &&
             startDate.getDate() === day.getDate()
    }) || null
  }

  return {
    getTourDateForDay
  }
}