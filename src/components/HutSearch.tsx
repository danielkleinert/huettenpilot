import { useState, useMemo } from 'react'
import { Input } from './ui/input'
import hutData from '@/hut_ids.json'
import type { Hut } from '@/types'

interface HutSearchProps {
  onSelectHut: (hut: Hut) => void
}

export function HutSearch({ onSelectHut }: HutSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHuts = useMemo(() => {
    if (!searchTerm) return []
    
    return hutData
      .filter(hut => 
        hut.hutName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10)
  }, [searchTerm])

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
        className="w-full"
      />
      {searchTerm && filteredHuts.length > 0 && (
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