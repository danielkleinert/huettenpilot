import { useEffect, useRef, useCallback } from 'react'
import type { Map } from 'ol'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { fromLonLat } from 'ol/proj'
import type { Hut } from '@/types'
import { createAllHutsLayer, createTourLayer } from '@/lib/mapUtils'

export function useMapLayers(map: Map | null, selectedHuts: Hut[]) {
  const tourLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const allHutsLayerRef = useRef<VectorLayer<VectorSource> | null>(null)

  const fitViewToSelection = useCallback(() => {
    if (!map) return

    const hutsWithCoordinates = selectedHuts.filter((hut) => hut.coordinates)
    if (hutsWithCoordinates.length > 0 && tourLayerRef.current) {
      const source = tourLayerRef.current.getSource()
      if (source && source.getFeatures().length > 0) {
        map.getView().fit(source.getExtent(), {
          padding: [50, 50, 50, 50],
          maxZoom: 12,
          duration: 500,
        })
      }
    } else {
      map.getView().setCenter(fromLonLat([11.5, 47]))
      map.getView().setZoom(5.8)
    }
  }, [map, selectedHuts])

  useEffect(() => {
    if (!map) return

    // Add layer with all huts (only once)
    if (!allHutsLayerRef.current) {
      allHutsLayerRef.current = createAllHutsLayer()
      map.addLayer(allHutsLayerRef.current)
    }

    // Remove previous tour layer
    if (tourLayerRef.current) {
      map.removeLayer(tourLayerRef.current)
    }

    // Add new tour layer
    tourLayerRef.current = createTourLayer(selectedHuts)
    map.addLayer(tourLayerRef.current)

    fitViewToSelection()
  }, [map, selectedHuts, fitViewToSelection])

  return { fitViewToSelection }
}
