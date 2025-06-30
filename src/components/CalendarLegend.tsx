import { useTranslation } from 'react-i18next'
import { AvailabilityStatus, getAvailabilityColorClass } from '@/lib/availability'

export function CalendarLegend() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className={getAvailabilityColorClass(AvailabilityStatus.GOOD)}>●</span>
        <span>{t('calendar.legend.available')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={getAvailabilityColorClass(AvailabilityStatus.LIMITED)}>●</span>
        <span>{t('calendar.legend.limited')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={getAvailabilityColorClass(AvailabilityStatus.NONE)}>●</span>
        <span>{t('calendar.legend.noAvailability')}</span>
      </div>
    </div>
  )
}