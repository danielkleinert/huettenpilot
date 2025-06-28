import {Bed, ExternalLink, GripVertical, Mountain, Ticket, X} from 'lucide-react'
import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import type {Hut} from '@/types'
import {useHutInfo} from '@/hooks/useHutInfo'

interface SortableHutItemProps {
  hut: Hut
  index: number
  onRemove: (index: number) => void
}

export function SortableHutItem({ hut, index, onRemove }: SortableHutItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hut.hutId })

  const { data: hutInfo, isLoading } = useHutInfo(hut.hutId)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getTotalBeds = () => {
    if (!hutInfo?.hutBedCategories) return hutInfo?.totalBedsInfo || 'N/A'
    const total = hutInfo.hutBedCategories.reduce((sum, category) => sum + category.totalSleepingPlaces, 0)
    return total > 0 ? total.toString() : hutInfo.totalBedsInfo || 'N/A'
  }

  const formatWebsite = (website: string) => {
    if (!website) return undefined
    return website.startsWith('http') ? website : `https://${website}`
  }

  const details = () => {
    return <>
      {isLoading && (
          <div className="text-sm text-muted-foreground">Loading hut details...</div>
      )}

      {hutInfo && (
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4"/>
                <span>{getTotalBeds()}</span>
              </div>

              {hutInfo.altitude && (
                  <div className="flex items-center gap-1">
                    <Mountain className="h-4 w-4"/>
                    <span>{hutInfo.altitude}</span>
                  </div>
              )}

              {hutInfo.hutWebsite && (
                  <a
                      href={formatWebsite(hutInfo.hutWebsite)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-blue-600 p-1 rounded-md hover:bg-blue-600/10"
                      onClick={(e) => e.stopPropagation()}
                      title={hutInfo.hutWebsite}
                  >
                    <ExternalLink className="h-4 w-4"/>
                  </a>
              )}

              <a
                  href={`https://www.hut-reservation.org/reservation/book-hut/${hut.hutId}/wizard`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-green-600 p-1 rounded-md hover:bg-green-600/10"
                  onClick={(e) => e.stopPropagation()}
                  title="Book this hut"
              >
                <Ticket className="h-4 w-4"/>
              </a>
            </div>
          </div>
      )}
    </>;
  }

  return (
    <div
        ref={setNodeRef}
        style={style}
        className={`@container p-4 bg-success/10 bg-card border border-success/20 rounded-md ${
            isDragging ? 'opacity-50' : ''
        }`}
    >
      <div className="flex items-start gap-4">
        <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1"
        >
          <GripVertical className="h-4 w-4"/>
        </div>

        {hutInfo?.picture?.blobPath && (
            <img
                src={hutInfo.picture.blobPath}
                alt={hut.hutName}
                className="hidden @sm:block w-20 h-16 object-cover rounded flex-shrink-0"
                loading="lazy"
            />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-success text-lg mb-2">
            {hut.hutName}
          </div>

          <div className="hidden @sm:block">
            {details()}
          </div>

        </div>

        <button
            onClick={() => onRemove(index)}
            className="text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-destructive/10 flex-shrink-0"
        >
          <X className="h-5 w-5"/>
        </button>
      </div>

      <div className="@sm:hidden">
        {details()}
      </div>

    </div>
  )
}