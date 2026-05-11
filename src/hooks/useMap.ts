import { useEffect, useRef, useState } from 'react'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { MAPTILER_API_KEY, INITIAL_VIEW } from '@/lib/mapUtils'
import type { Point } from 'geojson'

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
      style: '/styles/outdoor-custom.json',
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
      map.setSky({
        'sky-color': '#a4cdf2',
        'horizon-color': '#dbe9f4',
        'fog-color': '#dbe9f4',
        'sky-horizon-blend': 0.6,
        'horizon-fog-blend': 0.6,
        'fog-ground-blend': 0.8,
        'atmosphere-blend': 0.8,
      })
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
