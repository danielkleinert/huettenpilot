import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { TourOption } from '@/types'
import { CalendarMonth } from './CalendarMonth'
import { DatePopup } from './DatePopup'
import { CalendarLegend } from './CalendarLegend'
import { useCalendarUtils } from '@/hooks/useCalendarUtils'

interface TourCalendarProps {
  tourDates: TourOption[]
  groupSize: number
}

export function TourCalendar({ tourDates, groupSize }: TourCalendarProps) {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const { getTourOptionForDay } = useCalendarUtils(tourDates)

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target as Element
      if (!target.closest('.calendar-date') && !target.closest('.date-popup')) {
        setSelectedDate(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const today = new Date()
  const months = []
  for (let i = 0; i < 4; i++) {
    const month = new Date(today.getFullYear(), today.getMonth() + i, 1)
    months.push(month)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(selectedDate === date ? null : date)
  }

  const handleDateHover = (date: Date | null) => {
    setHoveredDate(date)
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">{t('calendar.title')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {months.map((month, monthIndex) => (
          <CalendarMonth
            key={monthIndex}
            month={month}
            groupSize={groupSize}
            hoveredDate={hoveredDate}
            onDateClick={handleDateClick}
            onDateHover={handleDateHover}
            getTourOptionForDay={getTourOptionForDay}
          />
        ))}
      </div>

      {selectedDate && (() => {
        const tourDate = getTourOptionForDay(selectedDate)
        
        if (!tourDate) return null
        
        return (
          <DatePopup
            selectedDate={selectedDate}
            tourDate={tourDate}
            groupSize={groupSize}
          />
        )
      })()}

      <CalendarLegend />

      {tourDates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('calendar.noDateFound')}
        </div>
      )}
    </div>
  )
}