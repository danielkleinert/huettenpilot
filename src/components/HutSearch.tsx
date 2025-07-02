import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleDashed } from 'lucide-react'
import { Input } from './ui/input'
import hutData from '@/hut_ids.json'
import type { Hut } from '@/types'
import { calculateDistance, fuzzyHutNameMatch, createPlaceholderHut } from '@/lib/utils'
import { AvailabilityStatus, getAvailabilityColorClass } from '@/lib/availability'

interface HutSearchProps {
  onSelectHut: (hut: Hut) => void
  selectedHuts: Hut[]
}

export function HutSearch({ onSelectHut, selectedHuts }: HutSearchProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const filteredHuts = useMemo(() => {
    const placeholderHut = createPlaceholderHut()
    
    let huts = [placeholderHut, ...(hutData as Hut[])]

    if (searchTerm) {
      huts = huts.filter(hut => {
        if (hut.hutId < 0) {
          return t('hutSelector.placeholderHutName').toLowerCase().includes(searchTerm.toLowerCase()) ||
                 'placeholder'.toLowerCase().includes(searchTerm.toLowerCase())
        }
        return fuzzyHutNameMatch(hut.hutName, searchTerm)
      })
    }

    const lastHutWithCoords = selectedHuts.slice().reverse().find(hut => hut.coordinates)
    if (lastHutWithCoords) {
      const placeholderHuts = huts.filter(hut => hut.hutId < 0)
      const regularHutsWithCoords = huts
        .filter(hut => hut.coordinates !== null && hut.hutId > 0)
        .map(hut => ({
          ...hut,
          distance: calculateDistance(lastHutWithCoords.coordinates!, hut.coordinates!)
        }))
        .sort((a, b) => a.distance - b.distance)
      
      huts = searchTerm 
        ? [...placeholderHuts, ...regularHutsWithCoords]
        : [...regularHutsWithCoords, ...placeholderHuts]
    }

    return huts.slice(0, 10)
  }, [searchTerm, selectedHuts, t])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || filteredHuts.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredHuts.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? filteredHuts.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredHuts.length) {
          selectHut(filteredHuts[selectedIndex])
        }
        break
      case 'Escape':
        setIsFocused(false)
        setSelectedIndex(-1)
        break
    }
  }

  const selectHut = (hut: Hut) => {
    onSelectHut(hut)
    setSearchTerm('')
    setSelectedIndex(-1)
  }

  return (
    <div className="relative">
      <Input
        placeholder={t('hutSelector.searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setSelectedIndex(-1)
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => {
          setIsFocused(false)
          setSelectedIndex(-1)
        }, 200)}
        onKeyDown={handleKeyDown}
        className="w-full"
      />
      {isFocused && filteredHuts.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto backdrop-blur-sm">
          {filteredHuts.map((hut, index) => (
            <button
              key={hut.hutId}
              className={`w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0 ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
              onClick={() => selectHut(hut)}
            >
              <div className="font-medium flex items-center gap-2">
                {hut.hutId < 0 && (
                  <CircleDashed className={`h-4 w-4 ${getAvailabilityColorClass(AvailabilityStatus.LIMITED)}`} />
                )}
                {hut.hutId < 0 ? t('hutSelector.placeholderHutName') : hut.hutName}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}