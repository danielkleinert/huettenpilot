import type { Hut } from '@/types'
import hutIds from '@/hut_ids.json'
import type { FeatureCollection, Feature, Point, LineString } from 'geojson'

export const MAPTILER_API_KEY = 'XNY3zRxbtlSGy9ojbIux';

export const INITIAL_VIEW = {
  center: [11.5, 47] as [number, number],
  zoom: 4.8,
  pitch: 0,
  bearing: 0
};

export function getAllHutsGeoJSON(): FeatureCollection<Point> {
  const features: Feature<Point>[] = []

  hutIds.forEach((hut) => {
    if (hut.coordinates) {
      const [lat, lon] = hut.coordinates
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          hutName: hut.hutName,
          hutId: hut.hutId,
        },
      })
    }
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

export function getTourGeoJSON(selectedHuts: Hut[]): FeatureCollection<Point | LineString> {
  const features: Feature<Point | LineString>[] = []
  const hutsWithCoordinates = selectedHuts.filter((hut) => hut.coordinates)

  // Add points
  hutsWithCoordinates.forEach((hut, index) => {
    const [lat, lon] = hut.coordinates!
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        hutName: hut.hutName,
        hutId: hut.hutId,
        isSelected: true,
        index: index + 1,
      },
    })
  })

  // Add line
  if (hutsWithCoordinates.length > 1) {
    const lineCoordinates = hutsWithCoordinates.map((hut) => {
      const [lat, lon] = hut.coordinates!
      return [lon, lat]
    })

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: lineCoordinates,
      },
      properties: {},
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

