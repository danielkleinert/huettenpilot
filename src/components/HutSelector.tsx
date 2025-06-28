import type { Hut } from '@/types'
import { SortableHutItem } from './SortableHutItem'
import { HutSearch } from './HutSearch'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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

interface HutSelectorProps {
  selectedHuts: Hut[]
  onHutsChange: (huts: Hut[]) => void
}

export function HutSelector({ selectedHuts, onHutsChange }: HutSelectorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

      <HutSearch
        selectedHuts={selectedHuts}
        onSelectHut={selectHut}
      />
    </div>
  )
}