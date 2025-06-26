import { useState, useEffect, useMemo } from 'react'
import { HutSelector } from './components/HutSelector'
import { TourCalendar } from './components/TourCalendar'
import { Input } from './components/ui/input'
import { useHutAvailability } from './hooks/useHutAvailability'
import { TourPlannerService } from './services/tourPlanner'
import type { Hut, TourDate } from './types'
import { Search, Users } from 'lucide-react'

function App() {
  const [selectedHuts, setSelectedHuts] = useState<Hut[]>([])
  const [groupSize, setGroupSize] = useState<number>(2)
  const [error, setError] = useState<string | null>(null)

  const hutIds = useMemo(() => selectedHuts.map(hut => hut.hutId), [selectedHuts])
  const { data: availabilityData, isLoading, isError, errors } = useHutAvailability(hutIds)
  const tourDates: TourDate[] = useMemo(() => {
    if (selectedHuts.length === 0 || isLoading) {
      return []
    }

    if (groupSize < 1 || groupSize > 50) {
      return []
    }

    if (Object.keys(availabilityData).length === 0) {
      return []
    }

    return TourPlannerService.findAvailableTourDates(
      selectedHuts,
      availabilityData,
      groupSize
    )
  }, [selectedHuts, availabilityData, groupSize, isLoading])

  useEffect(() => {
    if (selectedHuts.length === 0) {
      setError(null)
    } else if (groupSize < 1 || groupSize > 50) {
      setError('Group size must be between 1 and 50 people')
    } else if (isError && errors.length > 0) {
      setError('Failed to fetch hut availability. Please try again.')
    } else {
      setError(null)
    }
  }, [selectedHuts.length, groupSize, isError, errors])

  const handleHutsChange = (huts: Hut[]) => {
    setSelectedHuts(huts.filter(Boolean))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Alpine Hut Tour Planner
          </h1>
          <p className="text-gray-600">
            Plan your multi-day hut tour in the Alps. Find consecutive dates with available beds across your selected huts.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Group Size
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                    placeholder="Number of people"
                  />
                </div>

                <HutSelector 
                  selectedHuts={selectedHuts}
                  onHutsChange={handleHutsChange}
                />

                {selectedHuts.length > 0 && (
                  <div className="flex items-center justify-center p-3 bg-gray-50 rounded-md">
                    {isLoading ? (
                      <>
                        <Search className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                        <span className="text-sm text-gray-600">Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm text-gray-600">Search complete</span>
                      </>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {tourDates.length > 0 && !isLoading && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 text-sm font-medium">
                      Found {tourDates.length} available tour dates
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      {selectedHuts.length}-day tour for {groupSize} people
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Searching for available dates...</p>
                  </div>
                </div>
              ) : (
                <TourCalendar tourDates={tourDates} />
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-2">How it works</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. Select the huts you want to visit in order (Day 1, Day 2, etc.)</p>
            <p>2. Enter your group size to check bed availability</p>
            <p>3. View available start dates in the 4-month calendar</p>
            <p>4. Hover over green dots to see availability details for each hut</p>
            <p className="text-blue-600 text-xs pt-2">
              ℹ️ Availability data is automatically cached by React Query
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
