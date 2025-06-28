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

  const selectHut = (hut: Hut) => {
    onSelectHut(hut)
    setSearchTerm('')
  }

  return (
    <div className="relative">
      <Input
        placeholder="Search and add huts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        className="w-full"
      />
      {isFocused && filteredHuts.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto backdrop-blur-sm">
          {filteredHuts.map((hut) => (
            <button
              key={hut.hutId}
              className="w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0"
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