import { useState, useMemo } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Plus, X } from 'lucide-react'
import hutData from '@/hut_ids.json'
import type { Hut } from '@/types'

interface HutSelectorProps {
  selectedHuts: Hut[]
  onHutsChange: (huts: Hut[]) => void
}

export function HutSelector({ selectedHuts, onHutsChange }: HutSelectorProps) {
  const [searchTerms, setSearchTerms] = useState<string[]>([''])

  const filteredHuts = useMemo(() => {
    return searchTerms.map(term => 
      hutData.filter(hut => 
        hut.hutName.toLowerCase().includes(term.toLowerCase()) &&
        !selectedHuts.some(selected => selected.hutId === hut.hutId)
      ).slice(0, 10)
    )
  }, [searchTerms, selectedHuts])

  const addHutSelector = () => {
    setSearchTerms([...searchTerms, ''])
  }

  const removeHutSelector = (index: number) => {
    const newTerms = searchTerms.filter((_, i) => i !== index)
    setSearchTerms(newTerms.length === 0 ? [''] : newTerms)
    
    if (selectedHuts[index]) {
      const newHuts = selectedHuts.filter((_, i) => i !== index)
      onHutsChange(newHuts)
    }
  }

  const selectHut = (hut: Hut, index: number) => {
    const newHuts = [...selectedHuts]
    newHuts[index] = hut
    onHutsChange(newHuts)
    
    const newTerms = [...searchTerms]
    newTerms[index] = ''
    setSearchTerms(newTerms)
  }

  const updateSearchTerm = (value: string, index: number) => {
    const newTerms = [...searchTerms]
    newTerms[index] = value
    setSearchTerms(newTerms)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Select Huts for Your Tour</h2>
        <Button onClick={addHutSelector} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Hut
        </Button>
      </div>

      {searchTerms.map((term, index) => (
        <div key={index} className="relative">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Input
                placeholder={`Search for hut ${index + 1}...`}
                value={selectedHuts[index]?.hutName || term}
                onChange={(e) => updateSearchTerm(e.target.value, index)}
                className="w-full"
              />
              {term && filteredHuts[index] && filteredHuts[index].length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto backdrop-blur-sm">
                  {filteredHuts[index].map((hut) => (
                    <button
                      key={hut.hutId}
                      className="w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0"
                      onClick={() => selectHut(hut, index)}
                    >
                      <div className="font-medium">{hut.hutName}</div>
                      <div className="text-sm text-muted-foreground">ID: {hut.hutId}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {searchTerms.length > 1 && (
              <Button 
                onClick={() => removeHutSelector(index)} 
                size="sm" 
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {selectedHuts[index] && (
            <div className="mt-2 p-3 bg-success/10 border border-success/20 rounded-md">
              <div className="font-medium text-success">
                Day {index + 1}: {selectedHuts[index].hutName}
              </div>
              <div className="text-sm text-success">
                Hut ID: {selectedHuts[index].hutId}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {selectedHuts.length > 0 && (
        <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-md">
          <h3 className="font-medium text-info mb-2">Tour Summary</h3>
          <div className="text-sm text-info">
            {selectedHuts.length} hut{selectedHuts.length !== 1 ? 's' : ''} selected for your {selectedHuts.length}-day tour
          </div>
        </div>
      )}
    </div>
  )
}