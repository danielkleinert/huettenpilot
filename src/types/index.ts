export interface Hut {
  hutId: number
  hutName: string
}

export interface HutAvailability {
  freeBedsPerCategory: Record<string, number>
  freeBeds: number | null
  hutStatus: 'SERVICED' | 'NOT_SERVICED' | 'CLOSED'
  date: string
  dateFormatted: string
  totalSleepingPlaces: number
  percentage: 'AVAILABLE' | 'FULL' | 'NEARLY FULL' | 'CLOSED'
}

export interface HutInfo {
  hutWebsite: string
  hutId: number
  tenantCode: string
  hutUnlocked: boolean
  maxNumberOfNights: number
  hutName: string
  hutWarden: string
  phone: string
  coordinates: string
  altitude: string
  totalBedsInfo: string
  tenantCountry: string
  picture: {
    fileType: string
    blobPath: string
    fileName: string
    fileData: null
  }
  hutLanguages: string[]
  hutBedCategories: Array<{
    index: number
    categoryID: number
    rooms: unknown[]
    isVisible: boolean
    totalSleepingPlaces: number
    reservationMode: string
    hutBedCategoryLanguageData: Array<{
      language: string
      label: string
      shortLabel: string
      description: string
    }>
    isLinkedToReservation: boolean
    tenantBedCategoryId: number
  }>
  providerName: string
  hutGeneralDescriptions: Array<{
    description: string
    language: string
  }>
  supportLink: string | null
  waitingListEnabled: boolean
}

export interface TourDate {
  startDate: Date
  hutAvailabilities: Array<{
    hut: Hut
    availability: HutAvailability | null
  }>
  minAvailableBeds: number
}