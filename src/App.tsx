import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HutSelector } from './components/HutSelector'
import { TourCalendar } from './components/TourCalendar'
import TourMap from './components/TourMap'
import { Input } from './components/ui/input'
import { LoadingBar } from './components/ui/LoadingBar'
import { LanguageSelector } from './components/LanguageSelector'
import Impressum from './components/Impressum'
import Datenschutz from './components/Datenschutz'
import { useHutAvailability } from './hooks/useHutAvailability'
import { TourPlannerService } from './services/tourPlanner'
import type { Hut, TourOption } from './types'
import { Users } from 'lucide-react'
import { siGithub } from 'simple-icons'
import { getStateFromUrl, updateUrlState } from './lib/urlState'
import hutData from '@/hut_ids.json'

function App() {
  const { t } = useTranslation()
  const [selectedHuts, setSelectedHuts] = useState<Hut[]>([])
  const [groupSize, setGroupSize] = useState<number>(2)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentPage, setCurrentPage] = useState<'main' | 'impressum' | 'datenschutz'>('main')

  const hutIds = useMemo(() => selectedHuts.map(hut => hut.hutId), [selectedHuts])
  const { data: availabilityData, isLoading, isError, errors } = useHutAvailability(hutIds)
  const tourDates: TourOption[] = useMemo(() => {
    if (selectedHuts.length === 0 || isLoading) {
      return []
    }

    if (groupSize < 1) {
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
    } else if (groupSize < 1) {
      setError(t('errors.groupSizeInvalid'))
    } else if (isError && errors.length > 0) {
      setError(t('errors.fetchFailed'))
    } else {
      setError(null)
    }
  }, [selectedHuts.length, groupSize, isError, errors, t])

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

  const renderFooter = () => (
    <footer className="mt-16 pt-8 border-t border-border">
      <div className="flex justify-center items-center space-x-6">
        <button 
          onClick={() => setCurrentPage('impressum')}
          className="text-muted-foreground hover:text-foreground underline text-sm"
        >
          Impressum
        </button>
        <button 
          onClick={() => setCurrentPage('datenschutz')}
          className="text-muted-foreground hover:text-foreground underline text-sm"
        >
          Datenschutz
        </button>
        <a 
          href="https://github.com/danielkleinert/huettenpilot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d={siGithub.path} />
          </svg>

        </a>
        <LanguageSelector />
      </div>
    </footer>
  )

  if (currentPage === 'impressum') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={() => setCurrentPage('main')}
            className="mb-4 text-primary hover:underline"
          >
            ← Zurück zur Hauptseite
          </button>
          <Impressum />
          {renderFooter()}
        </div>
      </div>
    )
  }

  if (currentPage === 'datenschutz') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={() => setCurrentPage('main')}
            className="mb-4 text-primary hover:underline"
          >
            ← Zurück zur Hauptseite
          </button>
          <Datenschutz />
          {renderFooter()}
        </div>
      </div>
    )
  }

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('app.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('app.description')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <TourMap selectedHuts={selectedHuts} />
            
            <div className="sm:bg-card rounded-lg sm:shadow-sm sm:border border-border sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-card-foreground flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {t('hutSelector.groupSize')}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={groupSize || ''}
                    onChange={(e) => setGroupSize(parseInt(e.target.value) || 0)}
                    placeholder={t('hutSelector.groupSizePlaceholder')}
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
            <div className="sm:bg-card rounded-lg sm:shadow-sm sm:border border-border sm:p-6">
              <TourCalendar tourDates={tourDates} groupSize={groupSize}/>
            </div>
          </div>
        </div>

        {renderFooter()}

        </div>
      </div>
    </>
  )
}

export default App
