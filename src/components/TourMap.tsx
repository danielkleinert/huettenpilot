import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Hut } from '@/types'
import { Maximize2, X } from 'lucide-react'
import { useMap } from '@/hooks/useMap'
import { useMapLayers } from '@/hooks/useMapLayers'
import { motion } from 'framer-motion'
import '@maptiler/sdk/dist/maptiler-sdk.css'

interface TourMapProps {
  selectedHuts: Hut[]
}

export default function TourMap({ selectedHuts }: TourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlContainer, setControlContainer] = useState<HTMLDivElement | null>(null)

  const { map, popupHut, setPopupHut, isMapLoaded } = useMap(mapRef, popupRef)
  const { fitViewToSelection } = useMapLayers(map, isMapLoaded, selectedHuts)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setPopupHut(null)
  }

  const handleAnimationStart = () => {
    if (map) {
      map.resize()
      fitViewToSelection()
    }
  }

  useEffect(() => {
    if (!map) return

    const customControl = {
      onAdd: () => {
        const container = document.createElement('div')
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group fullscreen-toggle-ctrl'
        setControlContainer(container)
        return container
      },
      onRemove: () => {
        setControlContainer(null)
      }
    }

    map.addControl(customControl, 'top-right')

    return () => {
      map.removeControl(customControl)
    }
  }, [map])

  return (
    <>
      <div className={`mb-6 ${isFullscreen ? 'h-64' : ''}`}>
        <motion.div
          layout
          transition={{ duration: .3, ease: 'easeInOut' }}
          onLayoutAnimationStart={handleAnimationStart}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 bg-background'
              : 'relative w-full h-64 rounded-lg border border-border overflow-hidden'
          }
        >
          <div
            ref={mapRef}
            className={`${isFullscreen
              ? 'w-screen h-screen'
              : 'w-full h-full pointer-events-none [&_.maplibregl-ctrl-top-right_>_.maplibregl-ctrl-group:not(.fullscreen-toggle-ctrl)]:hidden'
              } relative`}
          />

          {controlContainer && createPortal(
            <motion.button
              layout
              transition={{ duration: .3, ease: 'easeInOut' }}
              onClick={toggleFullscreen}
              className="w-full h-full p-0 m-0 !flex !items-center !justify-center bg-transparent transition-colors hover:bg-gray-100 rounded-sm focus:outline-none"
              title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            >
              {isFullscreen ? <X className="h-4 w-4 text-black" /> : <Maximize2 className="h-4 w-4 text-black" />}
            </motion.button>,
            controlContainer
          )}
        </motion.div>
      </div>

      <div
        ref={popupRef}
        className={`${popupHut ? 'block' : 'hidden'
          } p-2 bg-card border border-border rounded-lg shadow-lg w-max text-foreground text-sm`}
      >
        <div className="font-medium">{popupHut}</div>
      </div>
    </>
  )
}