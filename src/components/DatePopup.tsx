import { useTranslation } from 'react-i18next'
import type { TourDate } from '@/types'
import { getAvailabilityColorClassForBeds } from '@/lib/availability'

interface DatePopupProps {
  selectedDate: Date
  tourDate: TourDate
  groupSize: number
}

export function DatePopup({
  selectedDate,
  tourDate,
  groupSize
}: DatePopupProps) {
  const { t } = useTranslation()

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div 
      className="date-popup fixed bottom-4 right-4 bg-card border border-border text-card-foreground p-4 rounded-lg shadow-lg max-w-sm z-50 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-semibold mb-2">
        {tourDate && tourDate.minAvailableBeds >= groupSize 
          ? t('calendar.tourStarting', { date: formatDate(selectedDate) })
          : t('calendar.availabilityFor', { date: formatDate(selectedDate) })
        }
      </div>
      <div className="space-y-2">
        {tourDate.hutAvailabilities.map(({ hut, availability }, index) => (
          <div key={hut.hutId} className="text-sm">
            <div className="font-medium">
              {t('calendar.day', { number: index + 1 })}: {hut.hutName}
            </div>
            <div className={`text-sm ${
              availability 
                ? getAvailabilityColorClassForBeds(availability.freeBeds, groupSize)
                : 'text-muted-foreground'
            }`}>
              {availability 
                ? availability.hutStatus === 'CLOSED'
                  ? t('calendar.closed')
                  : t('calendar.bedsAvailable', { count: availability.freeBeds || 0 })
                : t('calendar.noAvailabilityData')
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}