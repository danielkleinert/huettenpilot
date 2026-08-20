import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleMcpRequest } from './protocol.ts'
import { clearUpstreamCache } from './upstream.ts'

const ENDPOINT = 'https://huettenpilot.netlify.app/mcp'

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })
}

function rpc(method: string, params?: Record<string, unknown>, id: string | number = 1) {
  return post({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) })
}

async function callTool(name: string, args: Record<string, unknown>) {
  const response = await handleMcpRequest(rpc('tools/call', { name, arguments: args }))
  return response.json()
}

async function toolPayload(name: string, args: Record<string, unknown>) {
  const body = await callTool(name, args)
  return JSON.parse(body.result.content[0].text)
}

describe('http handling', () => {
  it('answers preflight', async () => {
    const response = await handleMcpRequest(new Request(ENDPOINT, { method: 'OPTIONS' }))
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('rejects GET with 405 because no SSE stream is offered', async () => {
    const response = await handleMcpRequest(new Request(ENDPOINT))
    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS')
  })

  it('rejects an unparseable body', async () => {
    const request = new Request(ENDPOINT, { method: 'POST', body: 'not json' })
    const response = await handleMcpRequest(request)
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe(-32700)
  })

  it('rejects an unsupported protocol version header', async () => {
    const response = await handleMcpRequest(rpc('ping', undefined, 1))
    expect(response.status).toBe(200)

    const rejected = await handleMcpRequest(
      post({ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'MCP-Protocol-Version': '1999-01-01' })
    )
    expect(rejected.status).toBe(400)
  })

  it('accepts a supported protocol version header', async () => {
    const response = await handleMcpRequest(
      post({ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'MCP-Protocol-Version': '2025-06-18' })
    )
    expect(response.status).toBe(200)
  })

  it('acknowledges notifications with 202 and no body', async () => {
    const response = await handleMcpRequest(post({ jsonrpc: '2.0', method: 'notifications/initialized' }))
    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
  })

  it('refuses batched requests', async () => {
    const response = await handleMcpRequest(post([{ jsonrpc: '2.0', id: 1, method: 'ping' }]))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe(-32600)
  })
})

describe('initialize', () => {
  it('echoes a protocol version the client asked for', async () => {
    const response = await handleMcpRequest(rpc('initialize', { protocolVersion: '2025-06-18' }))
    const body = await response.json()

    expect(body.result.protocolVersion).toBe('2025-06-18')
    expect(body.result.capabilities.tools).toBeDefined()
    expect(body.result.serverInfo.name).toBe('huettenpilot')
    expect(body.result.instructions).toContain('hut-reservation.org')
  })

  it('offers the latest version when the client asks for an unknown one', async () => {
    const response = await handleMcpRequest(rpc('initialize', { protocolVersion: '1999-01-01' }))
    expect((await response.json()).result.protocolVersion).toBe('2025-11-25')
  })
})

describe('tools/list', () => {
  it('advertises every tool with a schema and a description', async () => {
    const response = await handleMcpRequest(rpc('tools/list'))
    const { tools } = (await response.json()).result

    expect(tools.map((tool: { name: string }) => tool.name)).toEqual([
      'search_huts',
      'find_huts_near',
      'get_hut_details',
      'get_hut_availability',
      'create_tour_link'
    ])
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(20)
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.annotations.readOnlyHint).toBe(true)
    }
  })
})

describe('method routing', () => {
  it('reports unknown methods', async () => {
    const response = await handleMcpRequest(rpc('resources/list'))
    expect((await response.json()).error.code).toBe(-32601)
  })

  it('answers ping with an empty result', async () => {
    const response = await handleMcpRequest(rpc('ping'))
    expect((await response.json()).result).toEqual({})
  })
})

describe('tools/call argument handling', () => {
  it('rejects an unknown tool name', async () => {
    const body = await callTool('plan_my_holiday', {})
    expect(body.error.code).toBe(-32602)
    expect(body.error.message).toContain('search_huts')
  })

  it('points at search_huts when a hut id does not exist', async () => {
    const body = await callTool('get_hut_details', { hutIds: [999999] })
    expect(body.error.code).toBe(-32602)
    expect(body.error.message).toContain('search_huts')
  })

  it('names the cap when too many huts are requested', async () => {
    const body = await callTool('get_hut_availability', {
      hutIds: Array.from({ length: 11 }, (_, index) => index + 1),
      startDate: '2026-07-01',
      endDate: '2026-07-05'
    })
    expect(body.error.message).toContain('at most 10')
  })

  it('explains a backwards date range', async () => {
    const body = await callTool('get_hut_availability', {
      hutIds: [9],
      startDate: '2026-07-10',
      endDate: '2026-07-01'
    })
    expect(body.error.message).toContain('before startDate')
  })

  it('explains an over-long date range', async () => {
    const body = await callTool('get_hut_availability', {
      hutIds: [9],
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    })
    expect(body.error.message).toContain('90')
  })

  it('rejects a date that is not a real calendar date', async () => {
    const body = await callTool('get_hut_availability', {
      hutIds: [9],
      startDate: '2026-02-31',
      endDate: '2026-03-01'
    })
    expect(body.error.message).toContain('not a real calendar date')
  })

  it('requires exactly one anchor for find_huts_near', async () => {
    const missing = await callTool('find_huts_near', {})
    expect(missing.error.message).toContain('provide an anchor')

    const both = await callTool('find_huts_near', { hutId: 9, latitude: 46, longitude: 7 })
    expect(both.error.message).toContain('not both')
  })
})

describe('tools/call coercion', () => {
  it('accepts numbers sent as strings', async () => {
    const payload = await toolPayload('create_tour_link', { hutIds: ['9', '1'], groupSize: '4' })
    expect(payload.url).toBe('https://huettenpilot.netlify.app/?huts=9,1&size=4')
  })

  it('accepts a single hut id where a list is expected', async () => {
    const payload = await toolPayload('create_tour_link', { hutIds: 9 })
    expect(payload.url).toContain('huts=9')
    expect(payload.groupSize).toBe(2)
  })

  it('accepts dates written with slashes', async () => {
    const payload = await toolPayload('find_huts_near', { hutId: '9', radiusKm: '10' })
    expect(Array.isArray(payload)).toBe(true)
  })

  it('clamps an out-of-range group size', async () => {
    const payload = await toolPayload('create_tour_link', { hutIds: [9], groupSize: 500 })
    expect(payload.groupSize).toBe(50)
  })
})

describe('tools/call results', () => {
  it('returns matching huts for a search', async () => {
    const payload = await toolPayload('search_huts', { query: 'britannia' })
    expect(payload[0].hutId).toBe(9)
  })

  it('explains an empty search rather than returning a bare list', async () => {
    const payload = await toolPayload('search_huts', { query: 'zzzznotahut' })
    expect(payload.note).toContain('zzzznotahut')
  })

  it('returns nearby huts sorted by distance', async () => {
    const payload = await toolPayload('find_huts_near', { hutId: 9, radiusKm: 30, limit: 5 })
    expect(payload.length).toBeGreaterThan(0)
    expect(payload[0].distanceKm).toBeLessThanOrEqual(payload[payload.length - 1].distanceKm)
  })
})

describe('tools/call upstream failures', () => {
  beforeEach(() => {
    clearUpstreamCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearUpstreamCache()
  })

  it('reports an upstream outage as a tool error, not a protocol error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 502, statusText: 'Bad Gateway' })))

    const body = await callTool('get_hut_details', { hutIds: [9] })
    expect(body.error).toBeUndefined()
    expect(body.result.isError).toBe(true)
    expect(body.result.content[0].text).toContain('502')
  })

  it('notes the published window when a range has no data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      { date: '2026-08-20T00:00:00Z', dateFormatted: '20.08.2026', freeBeds: 5, freeBedsPerCategory: {}, hutStatus: 'SERVICED', percentage: 'AVAILABLE', totalSleepingPlaces: 10 }
    ]))))

    const payload = await toolPayload('get_hut_availability', {
      hutIds: [9],
      startDate: '2027-07-01',
      endDate: '2027-07-05'
    })
    expect(payload[0].days).toEqual([])
    expect(payload[0].note).toContain('2026-08-20')
  })
})

describe('upstream routing', () => {
  const minimalHutInfo = {
    hutId: 9,
    hutName: 'Britanniahütte SAC',
    altitude: '3030 m',
    coordinates: '46.06, 7.93',
    tenantCountry: 'CH',
    hutWarden: '',
    phone: '',
    hutWebsite: '',
    maxNumberOfNights: 20,
    hutGeneralDescriptions: [],
    hutBedCategories: []
  }

  beforeEach(() => {
    clearUpstreamCache()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
      String(url).includes('hutInfo') ? minimalHutInfo : []
    ))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearUpstreamCache()
  })

  it('fetches hut details through our own proxy so the CDN cache is shared across isolates', async () => {
    await callTool('get_hut_details', { hutIds: [9] })
    expect(fetch).toHaveBeenCalledWith('https://huettenpilot.netlify.app/api/v1/reservation/hutInfo/9')
  })

  it('follows the origin of the incoming request, so local dev proxies locally', async () => {
    await handleMcpRequest(new Request('http://localhost:8899/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'get_hut_details', arguments: { hutIds: [9] } }
      })
    }))
    expect(fetch).toHaveBeenCalledWith('http://localhost:8899/api/v1/reservation/hutInfo/9')
  })

  it('fetches availability straight from upstream, which the proxy marks no-cache anyway', async () => {
    await callTool('get_hut_availability', { hutIds: [9], startDate: '2026-08-21', endDate: '2026-08-22' })
    expect(fetch).toHaveBeenCalledWith('https://www.hut-reservation.org/api/v1/reservation/getHutAvailability?hutId=9')
  })
})
