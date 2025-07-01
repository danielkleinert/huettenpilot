import { useRef, useState } from 'react'
import type { Hut } from '@/types'
import { Maximize2, X } from 'lucide-react'
import { useMap } from '@/hooks/useMap'
import { useMapLayers } from '@/hooks/useMapLayers'
import 'ol/ol.css'
import { motion } from 'framer-motion'

interface TourMapProps {
  selectedHuts: Hut[]
}

export default function TourMap({ selectedHuts }: TourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { map, popupHut, setPopupHut } = useMap(mapRef, popupRef)
  const { fitViewToSelection } = useMapLayers(map, selectedHuts)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setPopupHut(null)
  }

  const handleAnimationComplete = () => {
    if (map) {
      map.updateSize()
      fitViewToSelection()
    }
  }

  return (
    <>
      <div className={`mb-6 ${isFullscreen ? 'h-64' : ''}`}>
        <motion.div
          layout
          transition={{ duration: .3, ease: 'easeInOut' }}
          onLayoutAnimationStart={handleAnimationComplete}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 bg-background'
              : 'relative w-full h-64 rounded-lg border border-border overflow-hidden'
          }
        >
          <div
            ref={mapRef}
            className={`${
              isFullscreen ? 'w-screen h-screen' : 'w-full h-full pointer-events-none'
            }`}
          />
          <motion.button
            layout
            transition={{ duration: .3, ease: 'easeInOut' }}
            onClick={toggleFullscreen}
            className={`absolute z-10 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors shadow-lg ${
              isFullscreen ? 'top-4 right-4' : 'top-2 right-2'
            }`}
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </motion.button>
        </motion.div>
      </div>

      <div
        ref={popupRef}
        className={`${
          popupHut ? 'block' : 'hidden'
        } absolute z-[60] p-2 bg-card border border-border rounded-lg shadow-lg min-w-max`}
      >
        <div className="text-sm font-medium text-foreground">{popupHut}</div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
        </div>
      </div>
    </>
  )
}