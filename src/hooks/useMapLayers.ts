import { useEffect, useCallback } from 'react'
import * as maptilersdk from '@maptiler/sdk'
import type { Hut } from '@/types'
import { getAllHutsGeoJSON, getTourGeoJSON, INITIAL_VIEW } from '@/lib/mapUtils'
import type { FeatureCollection } from 'geojson'

export function useMapLayers(map: maptilersdk.Map | null, isMapLoaded: boolean, selectedHuts: Hut[]) {

  // Effect to add sources and layers once
  useEffect(() => {
    if (!map || !isMapLoaded) return

    // All Huts Source
    if (!map.getSource('all-huts-source')) {
      map.addSource('all-huts-source', {
        type: 'geojson',
        data: getAllHutsGeoJSON()
      })

      // All Huts Layer (Red Circles)
      map.addLayer({
        id: 'all-huts-layer',
        type: 'circle',
        source: 'all-huts-source',
        paint: {
          'circle-radius': 6,
          'circle-color': '#ef4444',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2
        }
      })
    }

    // Tour Source - Initialize with empty object to avoid dependency on selectedHuts here
    if (!map.getSource('tour-source')) {
      map.addSource('tour-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })

      // Tour Line Layer
      map.addLayer({
        id: 'tour-line-layer',
        type: 'line',
        source: 'tour-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3
        }
      })

      // Tour Huts Circle Layer (Blue Background)
      map.addLayer({
        id: 'tour-huts-layer-circle',
        type: 'circle',
        source: 'tour-source',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 14,
          'circle-color': '#3b82f6',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2
        }
      })

      // Tour Huts Text Layer (Number)
      map.addLayer({
        id: 'tour-huts-layer-symbol',
        type: 'symbol',
        source: 'tour-source',
        filter: ['==', '$type', 'Point'],
        layout: {
          'text-field': ['to-string', ['get', 'index']],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': 'white'
        }
      })
    }

  }, [map, isMapLoaded])

  const fitViewToSelection = useCallback(() => {
    if (!map) return
    const hutsWithCoords = selectedHuts.filter(h => h.coordinates)
    if (hutsWithCoords.length > 0) {
      const bounds = new maptilersdk.LngLatBounds()
      hutsWithCoords.forEach(h => {
        // coordinate structure in json is [lat, lon]
        // bounds.extend expects [lon, lat]
        bounds.extend([h.coordinates![1], h.coordinates![0]])
      })
      map.fitBounds(bounds, { padding: 80, maxZoom: 12 })
    } else {
      map.flyTo({
        center: INITIAL_VIEW.center,
        zoom: INITIAL_VIEW.zoom,
        pitch: INITIAL_VIEW.pitch,
        bearing: INITIAL_VIEW.bearing
      })
    }
  }, [map, selectedHuts])

  useEffect(() => {
    if (!map || !isMapLoaded) return


    const source = map.getSource('tour-source') as maptilersdk.GeoJSONSource
    if (source) {
      source.setData(getTourGeoJSON(selectedHuts) as FeatureCollection)
    }

    fitViewToSelection()
  }, [map, isMapLoaded, selectedHuts, fitViewToSelection])

  return { fitViewToSelection }
}
