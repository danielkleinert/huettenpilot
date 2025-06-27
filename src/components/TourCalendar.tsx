import { useState } from 'react'
import type { TourDate } from '@/types'

interface TourCalendarProps {
  tourDates: TourDate[]
  groupSize: number
}

export function TourCalendar({ tourDates, groupSize }: TourCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date()
  const months = []
  for (let i = 0; i < 4; i++) {
    const month = new Date(today.getFullYear(), today.getMonth() + i, 1)
    months.push(month)
  }

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

  const getTourDateForDay = (day: Date | null): TourDate | null => {
    if (!day) return null
    
    return tourDates.find(tourDate => {
      const startDate = tourDate.startDate
      return startDate.getFullYear() === day.getFullYear() &&
             startDate.getMonth() === day.getMonth() &&
             startDate.getDate() === day.getDate()
    }) || null
  }


  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAvailabilityColor = (availableBeds: number, groupSize: number) => {
    const hasGoodAvailability = availableBeds >= groupSize && (availableBeds - groupSize) >= 5
    const hasLimitedAvailability = availableBeds >= groupSize && (availableBeds - groupSize) < 5
    
    if (hasGoodAvailability) return 'text-green-700 dark:text-green-400'
    if (hasLimitedAvailability) return 'text-orange-600 dark:text-orange-400'
    return 'text-card-foreground'
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Available Tour Dates</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="bg-card border border-border rounded-lg p-4">
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
                const tourDate = getTourDateForDay(day)
                const availabilityColor = getAvailabilityColor(tourDate?.minAvailableBeds ?? 0, groupSize)
                
                const isToday = day && 
                  day.getFullYear() === today.getFullYear() &&
                  day.getMonth() === today.getMonth() &&
                  day.getDate() === today.getDate()

                return (
                  <div
                    key={dayIndex}
                    className={`
                      relative h-12 flex items-center justify-center text-sm cursor-pointer
                      ${day ? 'hover:bg-muted' : ''}
                      ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 font-semibold text-blue-800 dark:text-blue-200' : ''}
                      ${availabilityColor} ${tourDate?.minAvailableBeds && tourDate.minAvailableBeds >= groupSize ? 'font-medium' : ''}
                    `}
                    onMouseEnter={() => setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {day && (
                      <span>{day.getDate()}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {hoveredDate && (() => {
        const tourDate = getTourDateForDay(hoveredDate)
        
        if (!tourDate) return null
        
        return (
          <div className="fixed bottom-4 right-4 bg-card border border-border text-card-foreground p-4 rounded-lg shadow-lg max-w-sm z-50 backdrop-blur-sm">
            <div className="font-semibold mb-2">
              {tourDate && tourDate.minAvailableBeds >= groupSize ? `Tour starting ${formatDate(hoveredDate)}` : `Availability for ${formatDate(hoveredDate)}`}
            </div>
            <div className="space-y-2">
              {tourDate.hutAvailabilities.map(({ hut, availability }, index) => (
                <div key={hut.hutId} className="text-sm">
                  <div className="font-medium">
                    Day {index + 1}: {hut.hutName}
                  </div>
                  <div className={`text-sm ${
                    availability 
                      ? getAvailabilityColor(availability.freeBeds, groupSize)
                      : 'text-muted-foreground'
                  }`}>
                    {availability 
                      ? `${availability.freeBeds} beds available`
                      : 'No availability data'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className={getAvailabilityColor(groupSize + 5, groupSize)}>●</span>
          <span>Available (5+ beds to spare)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={getAvailabilityColor(groupSize + 2, groupSize)}>●</span>
          <span>Limited (less than 5 beds to spare)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={getAvailabilityColor(groupSize - 1, groupSize)}>●</span>
          <span>No availability</span>
        </div>
      </div>

      {tourDates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No dates with availability data found.
        </div>
      )}
    </div>
  )
}