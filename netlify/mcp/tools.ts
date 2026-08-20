import { findHutsNear, getHut, searchHuts } from './huts.ts'
import {
  availabilityWindowEnd,
  fetchAvailability,
  fetchHutInfo,
  toAvailabilityDays,
  toHutDetails
} from './upstream.ts'

export const MAX_HUTS_PER_CALL = 10
export const MAX_TOUR_HUTS = 20
export const MAX_RANGE_DAYS = 90
export const APP_BASE_URL = 'https://huettenpilot.netlify.app'

export class ToolError extends Error {}

export interface ToolContext {
  siteOrigin: string
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown> | unknown
}

function asNumber(value: unknown, field: string): number {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new ToolError(`${field} must be a number, received ${JSON.stringify(value) ?? 'nothing'}`)
  }
  return parsed
}

function optionalNumber(value: unknown, field: string, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null) return fallback
  return Math.min(max, Math.max(min, asNumber(value, field)))
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ToolError(`${field} must be a non-empty string`)
  }
  return value.trim()
}

function asHutIds(value: unknown, maxCount: number): number[] {
  const list = Array.isArray(value) ? value : [value]
  if (list.length === 0 || list[0] === undefined || list[0] === null) {
    throw new ToolError('hutIds must contain at least one hut id — use search_huts to find ids by name')
  }
  if (list.length > maxCount) {
    throw new ToolError(
      `hutIds accepts at most ${maxCount} huts per call, received ${list.length} — split this into several calls`
    )
  }

  const ids = list.map((entry, index) => Math.trunc(asNumber(entry, `hutIds[${index}]`)))
  const unknownIds = ids.filter(id => getHut(id) === undefined)
  if (unknownIds.length > 0) {
    throw new ToolError(
      `unknown hut id(s) ${unknownIds.join(', ')} — use search_huts to look up the correct id by name`
    )
  }
  return ids
}

function asDate(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new ToolError(`${field} must be a date string formatted as YYYY-MM-DD`)
  }
  const normalized = value.trim().replace(/\//g, '-').split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new ToolError(`${field} must be formatted as YYYY-MM-DD, received "${value}"`)
  }
  const parsed = new Date(`${normalized}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(normalized)) {
    throw new ToolError(`${field} is not a real calendar date: "${value}"`)
  }
  return normalized
}

function daysInclusive(startDate: string, endDate: string): number {
  return (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000 + 1
}

function hutName(hutId: number): string {
  return getHut(hutId)?.hutName ?? `hut ${hutId}`
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'search_huts',
    description:
      'Find Alpine huts bookable through hut-reservation.org by name, and get the hutId needed by every other tool. Matching ignores case, spaces, hyphens and umlauts, so "bluemlisalp" finds "Blüemlisalphütte SAC".',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Part of a hut name, for example "Britannia" or "Monte Rosa".'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of huts to return. Defaults to 20.'
        }
      },
      required: ['query'],
      additionalProperties: false
    },
    handler: args => {
      const query = asString(args.query, 'query')
      const limit = optionalNumber(args.limit, 'limit', 20, 1, 100)
      const huts = searchHuts(query, limit)
      return huts.length > 0
        ? huts
        : { huts: [], note: `no hut name matches "${query}" — try a shorter fragment of the name` }
    }
  },
  {
    name: 'find_huts_near',
    description:
      'List huts around a location, nearest first, with straight-line distance in km. Anchor on an existing hut with hutId, or on a coordinate with latitude and longitude. Distances are geodesic, not walking distances — there is no trail routing here, so treat them as a lower bound on a day stage.',
    inputSchema: {
      type: 'object',
      properties: {
        hutId: {
          type: 'integer',
          description: 'Anchor on this hut. Provide either hutId or latitude+longitude, not both.'
        },
        latitude: { type: 'number', description: 'Anchor latitude in decimal degrees.' },
        longitude: { type: 'number', description: 'Anchor longitude in decimal degrees.' },
        radiusKm: {
          type: 'number',
          description: 'Only return huts within this straight-line radius. Defaults to 25.'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of huts to return. Defaults to 20.'
        }
      },
      additionalProperties: false
    },
    handler: args => {
      const hasHutId = args.hutId !== undefined && args.hutId !== null
      const hasCoordinates = args.latitude !== undefined && args.longitude !== undefined

      if (hasHutId && hasCoordinates) {
        throw new ToolError('provide either hutId or latitude+longitude as the anchor, not both')
      }
      if (!hasHutId && !hasCoordinates) {
        throw new ToolError('provide an anchor: either hutId, or both latitude and longitude')
      }

      const radiusKm = optionalNumber(args.radiusKm, 'radiusKm', 25, 1, 500)
      const limit = optionalNumber(args.limit, 'limit', 20, 1, 100)

      if (hasHutId) {
        const [hutId] = asHutIds(args.hutId, 1)
        const anchor = getHut(hutId)!
        if (anchor.coordinates === null) {
          throw new ToolError(
            `${anchor.hutName} has no coordinates on record — anchor on latitude+longitude instead`
          )
        }
        return findHutsNear(anchor.coordinates, radiusKm, limit, hutId)
      }

      const latitude = asNumber(args.latitude, 'latitude')
      const longitude = asNumber(args.longitude, 'longitude')
      if (latitude < -90 || latitude > 90) {
        throw new ToolError(`latitude must be between -90 and 90, received ${latitude}`)
      }
      if (longitude < -180 || longitude > 180) {
        throw new ToolError(`longitude must be between -180 and 180, received ${longitude}`)
      }
      return findHutsNear([latitude, longitude], radiusKm, limit)
    }
  },
  {
    name: 'get_hut_details',
    description:
      'Get details for up to 10 huts at once: altitude, warden, phone, website, bed categories, the maximum number of consecutive nights allowed, and the booking link.',
    inputSchema: {
      type: 'object',
      properties: {
        hutIds: {
          type: 'array',
          items: { type: 'integer' },
          description: `Hut ids from search_huts. At most ${MAX_HUTS_PER_CALL} per call.`
        },
        language: {
          type: 'string',
          description: 'Language for descriptions and bed category labels: EN, DE, FR or IT. Defaults to EN.'
        }
      },
      required: ['hutIds'],
      additionalProperties: false
    },
    handler: async (args, context) => {
      const hutIds = asHutIds(args.hutIds, MAX_HUTS_PER_CALL)
      const language = args.language === undefined ? 'EN' : asString(args.language, 'language')
      const infos = await Promise.all(hutIds.map(hutId => fetchHutInfo(hutId, context.siteOrigin)))
      return infos.map(info => toHutDetails(info, language))
    }
  },
  {
    name: 'get_hut_availability',
    description:
      'Get free beds per night for up to 10 huts over a date range of at most 90 days. freeBeds is what can actually be booked: it is 0 when the hut is unstaffed or full. Use this to find nights where every hut on a planned route has room.',
    inputSchema: {
      type: 'object',
      properties: {
        hutIds: {
          type: 'array',
          items: { type: 'integer' },
          description: `Hut ids from search_huts. At most ${MAX_HUTS_PER_CALL} per call.`
        },
        startDate: { type: 'string', description: 'First night, formatted as YYYY-MM-DD.' },
        endDate: { type: 'string', description: 'Last night, formatted as YYYY-MM-DD.' }
      },
      required: ['hutIds', 'startDate', 'endDate'],
      additionalProperties: false
    },
    handler: async args => {
      const hutIds = asHutIds(args.hutIds, MAX_HUTS_PER_CALL)
      const startDate = asDate(args.startDate, 'startDate')
      const endDate = asDate(args.endDate, 'endDate')

      if (endDate < startDate) {
        throw new ToolError(`endDate ${endDate} is before startDate ${startDate}`)
      }
      const span = daysInclusive(startDate, endDate)
      if (span > MAX_RANGE_DAYS) {
        throw new ToolError(
          `the range ${startDate}..${endDate} covers ${span} days, and at most ${MAX_RANGE_DAYS} are allowed per call — split it into several calls`
        )
      }

      return Promise.all(hutIds.map(async hutId => {
        const availability = await fetchAvailability(hutId)
        const days = toAvailabilityDays(availability, startDate, endDate)
        if (days.length > 0) {
          return { hutId, hutName: hutName(hutId), days }
        }
        return {
          hutId,
          hutName: hutName(hutId),
          days,
          note: `no nights published in this range — this hut has data through ${availabilityWindowEnd(availability) ?? 'no date at all'}`
        }
      }))
    }
  },
  {
    name: 'create_tour_link',
    description:
      'Build a Hüttenpilot link that opens a planned tour in the web app, showing a calendar of which start dates work and a map of the route. Give it back to the user so they can see and adjust the tour visually.',
    inputSchema: {
      type: 'object',
      properties: {
        hutIds: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Hut ids in the order they will be visited, one night each.'
        },
        groupSize: {
          type: 'integer',
          description: 'Number of people needing beds. Defaults to 2.'
        }
      },
      required: ['hutIds'],
      additionalProperties: false
    },
    handler: args => {
      const hutIds = asHutIds(args.hutIds, MAX_TOUR_HUTS)
      const groupSize = optionalNumber(args.groupSize, 'groupSize', 2, 1, 50)
      return {
        url: `${APP_BASE_URL}/?huts=${hutIds.join(',')}&size=${groupSize}`,
        huts: hutIds.map(hutId => ({ hutId, hutName: hutName(hutId) })),
        groupSize
      }
    }
  }
]

export const TOOLS_BY_NAME = new Map(TOOLS.map(tool => [tool.name, tool]))
