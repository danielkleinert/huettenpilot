export const AvailabilityStatus = {
  GOOD: 'good',
  LIMITED: 'limited',
  NONE: 'none'
} as const

export type AvailabilityStatus = typeof AvailabilityStatus[keyof typeof AvailabilityStatus]

export function getAvailabilityStatus(availableBeds: number | null, groupSize: number): AvailabilityStatus {
  if (availableBeds === null || availableBeds < groupSize) {
    return AvailabilityStatus.NONE
  }
  
  const hasGoodAvailability = availableBeds >= groupSize && (availableBeds - groupSize) >= 5
  return hasGoodAvailability ? AvailabilityStatus.GOOD : AvailabilityStatus.LIMITED
}

export function getAvailabilityColorClass(status: AvailabilityStatus): string {
  switch (status) {
    case AvailabilityStatus.GOOD:
      return 'text-green-700 dark:text-green-400'
    case AvailabilityStatus.LIMITED:
      return 'text-orange-600 dark:text-orange-400'
    case AvailabilityStatus.NONE:
    default:
      return 'text-card-foreground'
  }
}

export function getAvailabilityColorClassForBeds(availableBeds: number | null, groupSize: number): string {
  const status = getAvailabilityStatus(availableBeds, groupSize)
  return getAvailabilityColorClass(status)
}