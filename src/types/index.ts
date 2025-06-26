export interface Hut {
  hutId: number
  hutName: string
}

export interface HutAvailability {
  freeBedsPerCategory: Record<string, number>
  freeBeds: number
  hutStatus: 'SERVICED' | 'NOT_SERVICED' | 'CLOSED'
  date: string
  dateFormatted: string
  totalSleepingPlaces: number
  percentage: 'AVAILABLE' | 'FULL' | 'LIMITED'
}

export interface TourDate {
  startDate: Date
  hutAvailabilities: Array<{
    hut: Hut
    availability: HutAvailability
  }>
}