import { useTranslation } from 'react-i18next'
import type { TourOption } from '@/types'
import { getAvailabilityColorClassForBeds } from '@/lib/availability'

interface CalendarMonthProps {
  month: Date
  groupSize: number
  hoveredDate: Date | null
  onDateClick: (date: Date) => void
  onDateHover: (date: Date | null) => void
  getTourOptionForDay: (day: Date | null) => TourOption | null
}

export function CalendarMonth({
  month,
  groupSize,
  hoveredDate,
  onDateClick,
  onDateHover,
  getTourOptionForDay
}: CalendarMonthProps) {
  const { t } = useTranslation()

  const monthNames = [
    t('calendar.months.january'), t('calendar.months.february'), t('calendar.months.march'), 
    t('calendar.months.april'), t('calendar.months.may'), t('calendar.months.june'),
    t('calendar.months.july'), t('calendar.months.august'), t('calendar.months.september'), 
    t('calendar.months.october'), t('calendar.months.november'), t('calendar.months.december')
  ]

  const dayNames = [
    t('calendar.days.monday'), t('calendar.days.tuesday'), t('calendar.days.wednesday'), 
    t('calendar.days.thursday'), t('calendar.days.friday'), t('calendar.days.saturday'), t('calendar.days.sunday')
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7
    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const shouldHighlightDate = (day: Date | null): boolean => {
    if (!day || !hoveredDate) return false
    
    const hoveredTourOption = getTourOptionForDay(hoveredDate)
    if (!hoveredTourOption) return false
    
    const tourDurationDays = hoveredTourOption.hutAvailabilities.length
    const daysDiff = Math.floor((day.getTime() - hoveredDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysDiff >= 0 && daysDiff < tourDurationDays
  }

  const today = new Date()

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4 text-center">
        {monthNames[month.getMonth()]} {month.getFullYear()}
      </h3>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(month).map((day, dayIndex) => {
          const tourDate = getTourOptionForDay(day)
          const availabilityColor = getAvailabilityColorClassForBeds(tourDate?.minAvailableBeds ?? null, groupSize)
          
          const isToday = day && 
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate()

          const isPastDate = day && day < today && !isToday
          const isHighlighted = shouldHighlightDate(day)
          
          return (
            <div
              key={dayIndex}
              className={`
                calendar-date relative aspect-square flex items-center justify-center text-sm cursor-pointer
                ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 font-semibold text-blue-800 dark:text-blue-200' : ''}
                ${isHighlighted ? 'bg-muted' : ''}
                ${isPastDate ? 'text-muted-foreground' : availabilityColor} 
                ${tourDate?.minAvailableBeds && tourDate.minAvailableBeds >= groupSize ? 'font-medium' : ''}
              `}
              onClick={(e) => {
                e.stopPropagation()
                if (day) {
                  onDateClick(day)
                }
              }}
              onMouseEnter={() => {
                if (day && tourDate) {
                  onDateHover(day)
                }
              }}
              onMouseLeave={() => {
                onDateHover(null)
              }}
            >
              {day && (
                <span>{day.getDate()}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}