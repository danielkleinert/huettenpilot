import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { HutAvailability, HutInfo } from '../../src/types/index.ts'
import {
  availabilityWindowEnd,
  clearUpstreamCache,
  fetchAvailability,
  htmlToText,
  toAvailabilityDays,
  toHutDetails
} from './upstream.ts'

function day(date: string, overrides: Partial<HutAvailability> = {}): HutAvailability {
  return {
    date: `${date}T00:00:00Z`,
    dateFormatted: date,
    freeBeds: 20,
    freeBedsPerCategory: { '69': 20 },
    hutStatus: 'SERVICED',
    percentage: 'AVAILABLE',
    totalSleepingPlaces: 100,
    ...overrides
  }
}

describe('toAvailabilityDays', () => {
  const availability = [day('2026-07-01'), day('2026-07-02'), day('2026-07-03')]

  it('keeps only days inside the range, inclusive at both ends', () => {
    const days = toAvailabilityDays(availability, '2026-07-01', '2026-07-02')
    expect(days.map(entry => entry.date)).toEqual(['2026-07-01', '2026-07-02'])
  })

  it('reports zero bookable beds when the hut is not serviced', () => {
    const days = toAvailabilityDays([day('2026-07-01', { hutStatus: 'CLOSED' })], '2026-07-01', '2026-07-01')
    expect(days[0].freeBeds).toBe(0)
    expect(days[0].status).toBe('CLOSED')
  })

  it('reports zero bookable beds when the hut is full', () => {
    const days = toAvailabilityDays([day('2026-07-01', { percentage: 'FULL' })], '2026-07-01', '2026-07-01')
    expect(days[0].freeBeds).toBe(0)
  })

  it('treats a null bed count as zero', () => {
    const days = toAvailabilityDays([day('2026-07-01', { freeBeds: null })], '2026-07-01', '2026-07-01')
    expect(days[0].freeBeds).toBe(0)
  })
})

describe('availabilityWindowEnd', () => {
  it('returns the last published date', () => {
    expect(availabilityWindowEnd([day('2026-07-01'), day('2027-11-30')])).toBe('2027-11-30')
  })

  it('returns null when nothing is published', () => {
    expect(availabilityWindowEnd([])).toBeNull()
  })
})

describe('htmlToText', () => {
  it('turns list markup into plain bullet lines', () => {
    const text = htmlToText('<p>Note.</p><ul><li>No bed without reservation</li><li>Sleeping bag</li></ul>')
    expect(text).toBe('Note.\n\n- No bed without reservation\n- Sleeping bag')
  })

  it('decodes entities', () => {
    expect(htmlToText('<p>Bed &amp; breakfast</p>')).toBe('Bed & breakfast')
  })
})

function hutInfo(overrides: Partial<HutInfo> = {}): HutInfo {
  return {
    hutId: 9,
    hutName: 'Britanniahütte SAC',
    altitude: '3030 m',
    coordinates: '46.060106, 7.93507',
    tenantCountry: 'CH',
    hutWarden: 'Maria Anthamatten',
    phone: '+41 27 957 22 88',
    hutWebsite: 'http://www.britannia.ch',
    maxNumberOfNights: 20,
    hutGeneralDescriptions: [
      { language: 'EN', description: '<p>English text</p>' },
      { language: 'DE_CH', description: '<p>Deutscher Text</p>' }
    ],
    hutBedCategories: [
      {
        index: 0,
        categoryID: 69,
        rooms: [],
        isVisible: true,
        totalSleepingPlaces: 101,
        reservationMode: 'ROOM',
        hutBedCategoryLanguageData: [
          { language: 'DE_CH', label: 'Massenlager', shortLabel: 'ML', description: '' },
          { language: 'EN', label: 'Dormitory', shortLabel: 'DORM', description: '' }
        ],
        isLinkedToReservation: true,
        tenantBedCategoryId: 1
      },
      {
        index: 1,
        categoryID: 4252,
        rooms: [],
        isVisible: true,
        totalSleepingPlaces: 0,
        reservationMode: 'ROOM',
        hutBedCategoryLanguageData: [],
        isLinkedToReservation: true,
        tenantBedCategoryId: 2
      }
    ],
    tenantCode: 'CH',
    hutUnlocked: true,
    picture: { fileType: 'png', blobPath: '', fileName: '', fileData: null },
    hutLanguages: ['DE_CH'],
    totalBedsInfo: '101',
    providerName: 'SAC',
    supportLink: null,
    waitingListEnabled: false,
    ...overrides
  }
}

describe('toHutDetails', () => {
  it('selects the requested language and strips markup', () => {
    expect(toHutDetails(hutInfo(), 'EN').description).toBe('English text')
  })

  it('matches a regional variant such as DE_CH when asked for DE', () => {
    const details = toHutDetails(hutInfo(), 'DE')
    expect(details.description).toBe('Deutscher Text')
    expect(details.bedCategories[0].label).toBe('Massenlager')
  })

  it('falls back to English for a language the hut does not publish', () => {
    expect(toHutDetails(hutInfo(), 'ES').description).toBe('English text')
  })

  it('drops bed categories with no sleeping places', () => {
    expect(toHutDetails(hutInfo(), 'EN').bedCategories).toEqual([
      { label: 'Dormitory', totalSleepingPlaces: 101 }
    ])
  })

  it('builds the booking url', () => {
    expect(toHutDetails(hutInfo(), 'EN').bookingUrl)
      .toBe('https://www.hut-reservation.org/reservation/book-hut/9/wizard')
  })
})

describe('fetchAvailability caching', () => {
  beforeEach(() => {
    clearUpstreamCache()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([day('2026-07-01')]))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearUpstreamCache()
  })

  it('hits the network once for repeated reads of the same hut', async () => {
    await fetchAvailability(9)
    await fetchAvailability(9)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('fetches each hut separately', async () => {
    await fetchAvailability(9)
    await fetchAvailability(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('collapses concurrent reads of the same hut into one request', async () => {
    await Promise.all([fetchAvailability(9), fetchAvailability(9), fetchAvailability(9)])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failed request', async () => {
    clearUpstreamCache()
    const failing = vi.fn(async () => new Response('down', { status: 503, statusText: 'Service Unavailable' }))
    vi.stubGlobal('fetch', failing)

    await expect(fetchAvailability(9)).rejects.toThrow(/503/)
    await expect(fetchAvailability(9)).rejects.toThrow(/503/)
    expect(failing).toHaveBeenCalledTimes(2)
  })

  it('raises the upstream status when the request fails', async () => {
    clearUpstreamCache()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503, statusText: 'Service Unavailable' })))
    await expect(fetchAvailability(9)).rejects.toThrow(/503/)
  })
})
