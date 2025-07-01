import { useEffect, useRef, useState } from 'react'
import { Map, View } from 'ol'
import Overlay from 'ol/Overlay'
import { Attribution } from 'ol/control'
import { fromLonLat } from 'ol/proj'
import { createOpenTopoMapLayer } from '@/lib/mapUtils'

export function useMap(mapRef: React.RefObject<HTMLDivElement | null>, popupRef: React.RefObject<HTMLDivElement | null>) {
  const mapInstanceRef = useRef<Map | null>(null)
  const overlayRef = useRef<Overlay | null>(null)
  const [popupHut, setPopupHut] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current || !popupRef.current) return

    if (!mapInstanceRef.current) {
      overlayRef.current = new Overlay({
        element: popupRef.current,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      })

      mapInstanceRef.current = new Map({
        target: mapRef.current,
        layers: [createOpenTopoMapLayer()],
        view: new View({
          center: fromLonLat([10.5, 46.5]),
          zoom: 4,
        }),
        overlays: [overlayRef.current],
        controls: [new Attribution()],
      })

      mapInstanceRef.current.on('click', (evt) => {
        const feature = mapInstanceRef.current!.forEachFeatureAtPixel(evt.pixel, (f) => f)
        if (feature && feature.get('hutName')) {
          setPopupHut(feature.get('hutName'))
          overlayRef.current!.setPosition(evt.coordinate)
        } else {
          setPopupHut(null)
          overlayRef.current!.setPosition(undefined)
        }
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
        mapInstanceRef.current = null
      }
      if (overlayRef.current) {
        overlayRef.current = null
      }
    }
  }, [mapRef, popupRef])

  return { map: mapInstanceRef.current, popupHut, setPopupHut }
}
