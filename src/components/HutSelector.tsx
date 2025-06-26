import { useState, useMemo } from 'react'
import { Input } from './ui/input'
import { X, GripVertical } from 'lucide-react'
import hutData from '@/hut_ids.json'
import type { Hut } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface HutSelectorProps {
  selectedHuts: Hut[]
  onHutsChange: (huts: Hut[]) => void
}

interface SortableHutItemProps {
  hut: Hut
  index: number
  onRemove: (index: number) => void
}

function SortableHutItem({ hut, index, onRemove }: SortableHutItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hut.hutId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-success/10 border border-success/20 rounded-md flex items-center gap-3 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium text-success">
          Day {index + 1}: {hut.hutName}
        </div>
        <div className="text-sm text-success">
          Hut ID: {hut.hutId}
        </div>
      </div>
      
      <button
        onClick={() => onRemove(index)}
        className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function HutSelector({ selectedHuts, onHutsChange }: HutSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredHuts = useMemo(() => {
    if (!searchTerm) return []
    
    return hutData
      .filter(hut => 
        hut.hutName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedHuts.some(selected => selected.hutId === hut.hutId)
      )
      .slice(0, 10)
  }, [searchTerm, selectedHuts])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedHuts.findIndex(hut => hut.hutId === active.id)
      const newIndex = selectedHuts.findIndex(hut => hut.hutId === over.id)

      onHutsChange(arrayMove(selectedHuts, oldIndex, newIndex))
    }
  }

  const selectHut = (hut: Hut) => {
    onHutsChange([...selectedHuts, hut])
    setSearchTerm('')
  }

  const removeHut = (index: number) => {
    const newHuts = selectedHuts.filter((_, i) => i !== index)
    onHutsChange(newHuts)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Huts for Your Tour</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={selectedHuts.map(hut => hut.hutId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {selectedHuts.map((hut, index) => (
              <SortableHutItem
                key={hut.hutId}
                hut={hut}
                index={index}
                onRemove={removeHut}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
                <div className="text-sm text-muted-foreground">ID: {hut.hutId}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}