import { useEffect, useRef, useState, useCallback } from 'react'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { Style, Icon, Stroke, Circle, Fill } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { Attribution } from 'ol/control'
import Overlay from 'ol/Overlay'
import type { Hut } from '@/types'
import { Maximize2, X } from 'lucide-react'
import hutIds from '@/hut_ids.json'
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

function createHutMarkerStyle(): Style {
  return new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: '#ef4444'
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2
      })
    })
  })
}

function createOpenTopoMapLayer(): TileLayer<XYZ> {
  return new TileLayer({
    source: new XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions: [
        'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      ]
    })
  })
}

function createVectorLayerWithHuts(selectedHuts: Hut[]): VectorLayer<VectorSource> {
  const vectorSource = new VectorSource()

  // Add all huts from hut_ids.json
  hutIds.forEach((hut) => {
    if (hut.coordinates) {
      const [lat, lon] = hut.coordinates
      const transformedCoords = fromLonLat([lon, lat])
      const point = new Point(transformedCoords)
      const feature = new Feature({
        geometry: point,
        hutName: hut.hutName,
        hutId: hut.hutId
      })
      feature.setStyle(createHutMarkerStyle())
      vectorSource.addFeature(feature)
    }
  })

  // Add selected huts with numbered markers and connecting line
  const hutsWithCoordinates = selectedHuts.filter(hut => hut.coordinates !== null)
  if (hutsWithCoordinates.length > 0) {
    hutsWithCoordinates.forEach((hut, index) => {
      const [lat, lon] = hut.coordinates!
      const transformedCoords = fromLonLat([lon, lat])
      const point = new Point(transformedCoords)
      const feature = new Feature({
        geometry: point,
        hutName: hut.hutName,
        hutId: hut.hutId,
        isSelected: true
      })
      feature.setStyle(createNumberedMarkerStyle(index + 1))
      vectorSource.addFeature(feature)
    })

    // Add connecting line for selected huts
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
  }

  return new VectorLayer({
    source: vectorSource
  })
}

export default function TourMap({ selectedHuts }: TourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const overlayRef = useRef<Overlay | null>(null)
  const lastSelectedHutIds = useRef<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [popupHut, setPopupHut] = useState<string | null>(null)

  const hutsWithCoordinates = selectedHuts.filter(hut => hut.coordinates !== null)
  const selectedHutIds = selectedHuts.map(hut => hut.hutId).sort().join(',')

  const fitViewToSelection = useCallback(() => {
    if (!mapInstanceRef.current) return

    if (hutsWithCoordinates.length > 0) {
      const vectorLayer = mapInstanceRef.current.getLayers().getArray()
        .find(layer => layer instanceof VectorLayer) as VectorLayer<VectorSource>
      
      if (vectorLayer) {
        const selectedHutExtent = vectorLayer.getSource()!.getFeatures()
          .filter(f => f.get('isSelected'))
          .map(f => f.getGeometry()!.getExtent())
          .reduce((acc, extent) => {
            return [
              Math.min(acc[0], extent[0]),
              Math.min(acc[1], extent[1]),
              Math.max(acc[2], extent[2]),
              Math.max(acc[3], extent[3])
            ]
          }, [Infinity, Infinity, -Infinity, -Infinity])

        if (selectedHutExtent.every(coord => coord !== Infinity && coord !== -Infinity)) {
          mapInstanceRef.current.getView().fit(selectedHutExtent, {
            padding: [50, 50, 50, 50],
            maxZoom: 12
          })
        }
      }
    } else {
      // Show Alps region when no huts are selected
      mapInstanceRef.current.getView().setCenter(fromLonLat([10.5, 46.5]))
      mapInstanceRef.current.getView().setZoom(6)
    }
  }, [hutsWithCoordinates])

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
          zoom: 4
        }),
        overlays: [overlayRef.current],
        controls: [new Attribution()]
      })

      mapInstanceRef.current.on('click', (evt) => {
        const feature = mapInstanceRef.current!.forEachFeatureAtPixel(evt.pixel, (feature) => feature)
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
  }, [])

  // Update vector layers and fit view only when hut selection actually changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Only update if the selection actually changed
    if (selectedHutIds === lastSelectedHutIds.current) return
    lastSelectedHutIds.current = selectedHutIds

    // Clear existing vector layers
    const existingVectorLayers = mapInstanceRef.current.getLayers().getArray()
      .filter(layer => layer instanceof VectorLayer)
    existingVectorLayers.forEach(layer => {
      mapInstanceRef.current!.removeLayer(layer)
    })

    const vectorLayer = createVectorLayerWithHuts(selectedHuts)
    mapInstanceRef.current.addLayer(vectorLayer)

    // Fit view to selected huts
    fitViewToSelection()
  }, [selectedHuts, selectedHutIds, hutsWithCoordinates, fitViewToSelection])

  const toggleFullscreen = () => {
    const wasFullscreen = isFullscreen
    setIsFullscreen(!isFullscreen)
    setPopupHut(null)
    
    // Update map size after state change
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.updateSize()
        
        // If exiting fullscreen, fit view to selected huts
        if (wasFullscreen) {
          fitViewToSelection()
        }
      }
    }, 50)
  }

  return (
    <>
      <div className={`mb-6 ${isFullscreen ? 'h-64' : ''}`}>
        <div 
          className={
            isFullscreen 
              ? "fixed inset-0 z-50 bg-background"
              : "relative w-full h-64 rounded-lg border border-border overflow-hidden"
          }
        >
          <div 
            ref={mapRef} 
            className={`${
              isFullscreen 
                ? "w-screen h-screen" 
                : "w-full h-full pointer-events-none"
            }`}
          />
          <button
            onClick={toggleFullscreen}
            className={`absolute z-10 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors shadow-lg ${
              isFullscreen ? "top-4 right-4" : "top-2 right-2"
            }`}
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
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