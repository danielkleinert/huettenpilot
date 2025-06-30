import type { Hut } from '@/types'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      const oldIndex = parseInt(active.id as string)
      const newIndex = parseInt(over.id as string)

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
      <h2 className="text-xl font-semibold">{t('hutSelector.title')}</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={selectedHuts.map((_, index) => `${index}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {selectedHuts.map((hut, index) => (
              <SortableHutItem
                key={index}
                hut={hut}
                index={index}
                onRemove={removeHut}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <HutSearch
        onSelectHut={selectHut}
        selectedHuts={selectedHuts}
      />
    </div>
  )
}