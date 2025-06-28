import { useState, useMemo } from 'react'
import { Input } from './ui/input'
import hutData from '@/hut_ids.json'
import type { Hut } from '@/types'
import { calculateDistance } from '@/lib/utils'

interface HutSearchProps {
  onSelectHut: (hut: Hut) => void
  selectedHuts: Hut[]
}

export function HutSearch({ onSelectHut, selectedHuts }: HutSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const filteredHuts = useMemo(() => {
    let huts = hutData as Hut[]

    if (searchTerm) {
      huts = huts.filter(hut => 
        hut.hutName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    const lastHutWithCoords = selectedHuts.slice().reverse().find(hut => hut.coordinates)
    if (lastHutWithCoords) {
      huts = huts
        .filter(hut => hut.coordinates !== null)
        .map(hut => ({
          ...hut,
          distance: calculateDistance(lastHutWithCoords.coordinates!, hut.coordinates!)
        }))
        .sort((a, b) => a.distance - b.distance)
    }

    return huts.slice(0, 10)
  }, [searchTerm, selectedHuts])

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
        placeholder="Search and add huts..."
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
              <div className="font-medium">{hut.hutName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}