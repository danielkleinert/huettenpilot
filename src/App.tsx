import { useState, useEffect, useMemo } from 'react'
import { HutSelector } from './components/HutSelector'
import { TourCalendar } from './components/TourCalendar'
import TourMap from './components/TourMap'
import { Input } from './components/ui/input'
import { LoadingBar } from './components/ui/LoadingBar'
import { useHutAvailability } from './hooks/useHutAvailability'
import { TourPlannerService } from './services/tourPlanner'
import type { Hut, TourDate } from './types'
import { Users } from 'lucide-react'
import { getStateFromUrl, updateUrlState } from './lib/urlState'
import hutData from '@/hut_ids.json'

function App() {
  const [selectedHuts, setSelectedHuts] = useState<Hut[]>([])
  const [groupSize, setGroupSize] = useState<number>(2)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

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
      availabilityData
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

  // Initialize state from URL on component mount
  useEffect(() => {
    const urlState = getStateFromUrl()
    
    if (urlState.hutIds.length > 0) {
      const huts = urlState.hutIds
        .map(id => hutData.find(hut => hut.hutId === id))
        .filter((hut): hut is Hut => hut !== undefined)
      setSelectedHuts(huts)
    }
    
    setGroupSize(urlState.groupSize)
    setIsInitialized(true)
  }, [])

  // Update URL when state changes
  useEffect(() => {
    if (isInitialized) {
      updateUrlState(groupSize, selectedHuts)
    }
  }, [groupSize, selectedHuts, isInitialized])

  const handleHutsChange = (huts: Hut[]) => {
    setSelectedHuts(huts.filter(Boolean))
  }

  const handleGroupSizeChange = (size: number) => {
    setGroupSize(size)
  }

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hüttenpilot
          </h1>
          <p className="text-muted-foreground">
            Plan your multi-day hut tour in the Alps. Find consecutive dates with available beds across your selected huts.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <TourMap selectedHuts={selectedHuts} />
            
            <div className="sm:bg-card rounded-lg shadow-sm sm:border border-border sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-card-foreground flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Group Size
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={groupSize}
                    onChange={(e) => handleGroupSizeChange(parseInt(e.target.value) || 1)}
                    placeholder="Number of people"
                    className="w-32"
                  />
                </div>

                <HutSelector 
                  selectedHuts={selectedHuts}
                  onHutsChange={handleHutsChange}
                />

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sm:bg-card rounded-lg shadow-sm sm:border border-border sm:p-6">
              <TourCalendar tourDates={tourDates} groupSize={groupSize}/>
            </div>
          </div>
        </div>

        </div>
      </div>
    </>
  )
}

export default App
