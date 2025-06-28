import { useEffect, useRef, useState } from 'react'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { Style, Icon, Stroke } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { Attribution } from 'ol/control'
import type { Hut } from '@/types'
import { Maximize2, X } from 'lucide-react'
import 'ol/ol.css'

interface TourMapProps {
  selectedHuts: Hut[]
}

function createNumberedMarkerStyle(number: number): Style {
  return new Style({
    image: new Icon({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="2"/>
          <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${number}</text>
        </svg>
      `)}`,
      scale: 1,
      anchor: [0.5, 0.5]
    })
  })
}

export default function TourMap({ selectedHuts }: TourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const fullscreenMapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const fullscreenMapInstanceRef = useRef<Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const hutsWithCoordinates = selectedHuts.filter(hut => hut.coordinates !== null)

  useEffect(() => {
    if (!mapRef.current) return

    if (!mapInstanceRef.current) {
      const openTopoMapLayer = new TileLayer({
        source: new XYZ({
          url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attributions: [
            'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
          ]
        })
      })

      mapInstanceRef.current = new Map({
        target: mapRef.current,
        layers: [openTopoMapLayer],
        view: new View({
          center: fromLonLat([8.5, 46.8]),
          zoom: 8
        }),
        interactions: [],
        controls: [new Attribution()]
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing vector layers
    const existingVectorLayers = mapInstanceRef.current.getLayers().getArray()
      .filter(layer => layer instanceof VectorLayer)
    existingVectorLayers.forEach(layer => {
      mapInstanceRef.current!.removeLayer(layer)
    })

    // If no huts selected, show Alps region
    if (!hutsWithCoordinates || hutsWithCoordinates.length === 0) {
      mapInstanceRef.current.getView().setCenter(fromLonLat([10.5, 46.5]))
      mapInstanceRef.current.getView().setZoom(6)
      return
    }

    const vectorSource = new VectorSource()

    hutsWithCoordinates.forEach((hut, index) => {
      const [lat, lon] = hut.coordinates!
      const transformedCoords = fromLonLat([lon, lat])
      const point = new Point(transformedCoords)
      const feature = new Feature({
        geometry: point,
        name: hut.hutName
      })
      feature.setStyle(createNumberedMarkerStyle(index + 1))
      vectorSource.addFeature(feature)
    })

    if (hutsWithCoordinates.length > 1) {
      const lineCoordinates = hutsWithCoordinates.map(hut => {
        const [lat, lon] = hut.coordinates!
        return fromLonLat([lon, lat])
      })
      const lineString = new LineString(lineCoordinates)
      const lineFeature = new Feature({
        geometry: lineString
      })
      lineFeature.setStyle(new Style({
        stroke: new Stroke({
          color: '#3b82f6',
          width: 3
        })
      }))
      vectorSource.addFeature(lineFeature)
    }

    const vectorLayer = new VectorLayer({
      source: vectorSource
    })

    mapInstanceRef.current.addLayer(vectorLayer)

    if (hutsWithCoordinates.length > 0) {
      const extent = vectorSource.getExtent()
      if (extent.every(coord => coord !== Infinity && coord !== -Infinity)) {
        mapInstanceRef.current.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 12
        })
      }
    }
  }, [hutsWithCoordinates])

  const createFullscreenMap = () => {
    if (!fullscreenMapRef.current) return

    const openTopoMapLayer = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attributions: [
          'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        ]
      })
    })

    fullscreenMapInstanceRef.current = new Map({
      target: fullscreenMapRef.current,
      layers: [openTopoMapLayer],
      view: new View({
        center: fromLonLat([10.5, 46.5]),
        zoom: 6
      })
    })

    // If no huts selected, show Alps region only
    if (!hutsWithCoordinates || hutsWithCoordinates.length === 0) {
      return
    }

    const vectorSource = new VectorSource()

    hutsWithCoordinates.forEach((hut, index) => {
      const [lat, lon] = hut.coordinates!
      const transformedCoords = fromLonLat([lon, lat])
      const point = new Point(transformedCoords)
      const feature = new Feature({
        geometry: point,
        name: hut.hutName
      })
      feature.setStyle(createNumberedMarkerStyle(index + 1))
      vectorSource.addFeature(feature)
    })

    if (hutsWithCoordinates.length > 1) {
      const lineCoordinates = hutsWithCoordinates.map(hut => {
        const [lat, lon] = hut.coordinates!
        return fromLonLat([lon, lat])
      })
      const lineString = new LineString(lineCoordinates)
      const lineFeature = new Feature({
        geometry: lineString
      })
      lineFeature.setStyle(new Style({
        stroke: new Stroke({
          color: '#3b82f6',
          width: 3
        })
      }))
      vectorSource.addFeature(lineFeature)
    }

    const vectorLayer = new VectorLayer({
      source: vectorSource
    })

    fullscreenMapInstanceRef.current.addLayer(vectorLayer)

    if (hutsWithCoordinates.length > 0) {
      const extent = vectorSource.getExtent()
      if (extent.every(coord => coord !== Infinity && coord !== -Infinity)) {
        fullscreenMapInstanceRef.current.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 12
        })
      }
    }
  }

  const openFullscreen = () => {
    setIsFullscreen(true)
    setTimeout(createFullscreenMap, 100)
  }

  const closeFullscreen = () => {
    if (fullscreenMapInstanceRef.current) {
      fullscreenMapInstanceRef.current.setTarget(undefined)
      fullscreenMapInstanceRef.current = null
    }
    setIsFullscreen(false)
  }

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-lg border border-border overflow-hidden"
          />
          <button
            onClick={openFullscreen}
            className="absolute top-2 right-2 z-10 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors shadow-lg"
            title="View fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background !m-0">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={closeFullscreen}
              className="p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors shadow-lg"
              title="Close fullscreen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={fullscreenMapRef} className="w-full h-full" />
        </div>
      )}
    </>
  )
}