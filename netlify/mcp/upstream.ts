import type { HutAvailability, HutInfo } from '../../src/types/index.ts'

const UPSTREAM_BASE = 'https://www.hut-reservation.org/api/v1/reservation'
const PROXY_PATH = '/api/v1/reservation'
const BOOKING_BASE = 'https://www.hut-reservation.org/reservation/book-hut'
const AVAILABILITY_TTL_MS = 5 * 60 * 1000
const HUT_INFO_TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  response: Promise<unknown>
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`hut-reservation.org responded ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

function fetchCached<T>(key: string, ttlMs: number, url: string): Promise<T> {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response as Promise<T>
  }

  const response = fetchJson<T>(url)
  cache.set(key, { response, expiresAt: Date.now() + ttlMs })
  response.catch(() => {
    if (cache.get(key)?.response === response) {
      cache.delete(key)
    }
  })
  return response
}

export function fetchAvailability(hutId: number): Promise<HutAvailability[]> {
  return fetchCached(`availability:${hutId}`, AVAILABILITY_TTL_MS, `${UPSTREAM_BASE}/getHutAvailability?hutId=${hutId}`)
}

export function fetchHutInfo(hutId: number, siteOrigin: string): Promise<HutInfo> {
  return fetchCached(`hutInfo:${hutId}`, HUT_INFO_TTL_MS, `${siteOrigin}${PROXY_PATH}/hutInfo/${hutId}`)
}

export function clearUpstreamCache() {
  cache.clear()
}

export interface AvailabilityDay {
  date: string
  freeBeds: number
  totalBeds: number
  status: string
  percentage: string
  freeBedsPerCategory: Record<string, number>
}

export function toIsoDate(apiDate: string): string {
  return apiDate.split('T')[0]
}

export function availabilityWindowEnd(availability: HutAvailability[]): string | null {
  const last = availability[availability.length - 1]
  return last ? toIsoDate(last.date) : null
}

export function toAvailabilityDays(
  availability: HutAvailability[],
  startDate: string,
  endDate: string
): AvailabilityDay[] {
  return availability
    .filter(day => {
      const date = toIsoDate(day.date)
      return date >= startDate && date <= endDate
    })
    .map(day => ({
      date: toIsoDate(day.date),
      freeBeds: day.hutStatus === 'SERVICED' && day.percentage !== 'FULL' ? day.freeBeds ?? 0 : 0,
      totalBeds: day.totalSleepingPlaces,
      status: day.hutStatus,
      percentage: day.percentage,
      freeBedsPerCategory: day.freeBedsPerCategory
    }))
}

export interface HutDetails {
  hutId: number
  hutName: string
  altitude: string
  coordinates: string
  country: string
  warden: string
  phone: string
  website: string
  maxNumberOfNights: number
  bedCategories: Array<{ label: string, totalSleepingPlaces: number }>
  description: string
  bookingUrl: string
}

function pickLanguage<T extends { language: string }>(entries: T[], language: string): T | undefined {
  const wanted = language.toUpperCase()
  return entries.find(entry => entry.language.toUpperCase() === wanted)
    ?? entries.find(entry => entry.language.toUpperCase().startsWith(`${wanted}_`))
    ?? entries.find(entry => entry.language.toUpperCase().startsWith('EN'))
    ?? entries[0]
}

export function htmlToText(html: string): string {
  return html
    .replace(/<li>/gi, '\n- ')
    .replace(/<\/(p|div|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function toHutDetails(info: HutInfo, language: string): HutDetails {
  return {
    hutId: info.hutId,
    hutName: info.hutName,
    altitude: info.altitude,
    coordinates: info.coordinates,
    country: info.tenantCountry,
    warden: info.hutWarden,
    phone: info.phone,
    website: info.hutWebsite,
    maxNumberOfNights: info.maxNumberOfNights,
    bedCategories: info.hutBedCategories
      .filter(category => category.isVisible && category.totalSleepingPlaces > 0)
      .map(category => ({
        label: pickLanguage(category.hutBedCategoryLanguageData, language)?.label ?? '',
        totalSleepingPlaces: category.totalSleepingPlaces
      })),
    description: htmlToText(pickLanguage(info.hutGeneralDescriptions, language)?.description ?? ''),
    bookingUrl: `${BOOKING_BASE}/${info.hutId}/wizard`
  }
}
