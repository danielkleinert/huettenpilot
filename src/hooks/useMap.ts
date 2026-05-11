import { useEffect, useRef, useState } from 'react'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { MAPTILER_API_KEY, INITIAL_VIEW } from '@/lib/mapUtils'
import type { Point } from 'geojson'

const UNPAVED_PATH_CLASSES = ['path', 'path_pedestrian', 'track']

function isUnpavedPathLayer(filter: unknown): boolean {
  if (!filter) return false
  const flat = JSON.stringify(filter)
  // The "Pedestrian" layer also matches path/path_pedestrian but is keyed on paved surface.
  if (flat.includes('"paved"')) return false
  if (!flat.includes('"class"')) return false
  return UNPAVED_PATH_CLASSES.some(cls => flat.includes(`"${cls}"`))
}

export function useMap(mapContainer: React.RefObject<HTMLDivElement | null>, popupContainer: React.RefObject<HTMLDivElement | null>) {
  const mapInstanceRef = useRef<maptilersdk.Map | null>(null)
  const popupMarkerRef = useRef<maptilersdk.Marker | null>(null)
  const [popupHut, setPopupHut] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return
    if (mapInstanceRef.current) return

    maptilersdk.config.apiKey = MAPTILER_API_KEY

    const map = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.OUTDOOR,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      touchZoomRotate: true,
      touchPitch: true,
      trackResize: true,
      maxPitch: 85,
      terrainControl: true,
      geolocateControl: true,
      navigationControl: true,
      fullscreenControl: false,
    })

    mapInstanceRef.current = map

    map.on('load', () => {
      const style = map.getStyle()
      if (style && style.layers) {
        style.layers.forEach(layer => {
          const id = layer.id.toLowerCase()
          if (id.includes('contour')) {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
          }

          // Make non-waymarked hiking paths (unpaved path, path_pedestrian, track, steps)
          // more visible: darker color and slightly thicker. The MapTiler Outdoor style
          // renders these as low-contrast dashed lines that disappear on terrain.
          const transportationSourceLayer = (layer as { 'source-layer'?: string })['source-layer']
          if (
            layer.type === 'line' &&
            transportationSourceLayer === 'transportation' &&
            isUnpavedPathLayer(layer.filter)
          ) {
            map.setPaintProperty(layer.id, 'line-color', '#5a4a3a')
            map.setPaintProperty(layer.id, 'line-width', [
              'interpolate', ['linear'], ['zoom'],
              12, 1,
              16, 2.5,
              20, 4
            ])
          }
        })
      }

      // Add Mapterhorn Terrain Source
      map.addSource('terrainSource', {
        type: 'raster-dem',
        url: 'https://tiles.mapterhorn.com/tilejson.json',
        tileSize: 256
      })

      // Add Mapterhorn Hillshade Source
      map.addSource('hillshadeSource', {
        type: 'raster-dem',
        url: 'https://tiles.mapterhorn.com/tilejson.json',
        tileSize: 256
      })

      // Enable Terrain
      map.setTerrain({
        source: 'terrainSource',
        exaggeration: 1
      })

      // Add Hillshade Layer
      // Find the first symbol layer to insert hillshading before it
      let labelLayerId;
      const layers = map.getStyle().layers;
      if (layers) {
        for (const layer of layers) {
          if (layer.type === 'symbol') {
            labelLayerId = layer.id;
            break;
          }
        }
      }

      map.addLayer({
        id: 'hills',
        type: 'hillshade',
        source: 'hillshadeSource',
        paint: {
          'hillshade-shadow-color': '#473B24',
          'hillshade-exaggeration': 0.5
        }
      }, labelLayerId)

      setIsMapLoaded(true)
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
      popupMarkerRef.current = null
      setIsMapLoaded(false)
    }
  }, [mapContainer])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !popupContainer.current) return

    if (!popupMarkerRef.current) {
      popupMarkerRef.current = new maptilersdk.Marker({
        element: popupContainer.current,
        anchor: 'bottom',
      })
    }

    const onClick = (e: maptilersdk.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['all-huts-layer', 'tour-huts-layer-symbol']
      })

      if (features.length > 0) {
        const feature = features[0]
        const hutName = feature.properties?.hutName
        const geometry = feature.geometry as Point
        const coordinates = geometry.coordinates ? geometry.coordinates.slice() : null

        if (hutName && coordinates) {
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          setPopupHut(hutName)
          popupMarkerRef.current?.setLngLat(coordinates as [number, number]).addTo(map)
        }
      } else {
        setPopupHut(null)
        popupMarkerRef.current?.remove()
      }
    }

    const onMouseEnter = () => { map.getCanvas().style.cursor = 'pointer' }
    const onMouseLeave = () => { map.getCanvas().style.cursor = '' }

    if (isMapLoaded) {
      map.on('click', onClick)
      map.on('mouseenter', 'all-huts-layer', onMouseEnter)
      map.on('mouseleave', 'all-huts-layer', onMouseLeave)
      map.on('mouseenter', 'tour-huts-layer-symbol', onMouseEnter)
      map.on('mouseleave', 'tour-huts-layer-symbol', onMouseLeave)
    }

    return () => {
      if (map) {
        map.off('click', onClick)
        map.off('mouseenter', 'all-huts-layer', onMouseEnter)
        map.off('mouseleave', 'all-huts-layer', onMouseLeave)
        map.off('mouseenter', 'tour-huts-layer-symbol', onMouseEnter)
        map.off('mouseleave', 'tour-huts-layer-symbol', onMouseLeave)
      }
    }

  }, [popupContainer, isMapLoaded])


  return { map: mapInstanceRef.current, popupHut, setPopupHut, isMapLoaded }
}
