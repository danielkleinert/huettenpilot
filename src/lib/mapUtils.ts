import { Style, Icon, Circle, Fill, Stroke } from 'ol/style'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import type { Hut } from '@/types'
import hutIds from '@/hut_ids.json'

export function createNumberedMarkerStyle(number: number): Style {
  return new Style({
    image: new Icon({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="2"/>
          <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${number}</text>
        </svg>
      `)}`,
      scale: 1,
      anchor: [0.5, 0.5],
    }),
  })
}

export function createHutMarkerStyle(): Style {
  return new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: '#ef4444',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  })
}

export function createOpenTopoMapLayer(): TileLayer<XYZ> {
  return new TileLayer({
    source: new XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions: [
        'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      ],
    }),
  })
}

export function createAllHutsLayer(): VectorLayer<VectorSource> {
  const vectorSource = new VectorSource()
  hutIds.forEach((hut) => {
    if (hut.coordinates) {
      const [lat, lon] = hut.coordinates
      const feature = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
        hutName: hut.hutName,
        hutId: hut.hutId,
      })
      feature.setStyle(createHutMarkerStyle())
      vectorSource.addFeature(feature)
    }
  })
  return new VectorLayer({
    source: vectorSource,
    zIndex: 1,
  })
}

export function createTourLayer(selectedHuts: Hut[]): VectorLayer<VectorSource> {
  const vectorSource = new VectorSource()
  const hutsWithCoordinates = selectedHuts.filter((hut) => hut.coordinates)

  hutsWithCoordinates.forEach((hut, index) => {
    const [lat, lon] = hut.coordinates!
    const feature = new Feature({
      geometry: new Point(fromLonLat([lon, lat])),
      hutName: hut.hutName,
      hutId: hut.hutId,
      isSelected: true,
    })
    feature.setStyle(createNumberedMarkerStyle(index + 1))
    vectorSource.addFeature(feature)
  })

  if (hutsWithCoordinates.length > 1) {
    const lineCoordinates = hutsWithCoordinates.map((hut) => {
      const [lat, lon] = hut.coordinates!
      return fromLonLat([lon, lat])
    })
    const lineFeature = new Feature({
      geometry: new LineString(lineCoordinates),
    })
    lineFeature.setStyle(
      new Style({
        stroke: new Stroke({
          color: '#3b82f6',
          width: 3,
        }),
      }),
    )
    vectorSource.addFeature(lineFeature)
  }

  return new VectorLayer({
    source: vectorSource,
    zIndex: 2,
  })
}
