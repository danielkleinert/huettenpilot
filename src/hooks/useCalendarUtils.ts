import type { TourOption } from '@/types'

export function useCalendarUtils(tourDates: TourOption[]) {
  const getTourOptionForDay = (day: Date | null): TourOption | null => {
    if (!day) return null
    
    return tourDates.find(tourDate => {
      const startDate = tourDate.startDate
      return startDate.getFullYear() === day.getFullYear() &&
             startDate.getMonth() === day.getMonth() &&
             startDate.getDate() === day.getDate()
    }) || null
  }

  return {
    getTourOptionForDay
  }
}