import { TOOLS, TOOLS_BY_NAME, ToolError } from './tools.ts'
import type { ToolContext } from './tools.ts'

export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07']
const LATEST_PROTOCOL_VERSION = '2025-11-25'

const SERVER_INFO = { name: 'huettenpilot', version: '1.0.0' }

const INSTRUCTIONS = [
  'Plans multi-day tours across Alpine huts bookable through hut-reservation.org.',
  'Start with search_huts or find_huts_near to turn hut names into hut ids, then get_hut_availability to see free beds per night.',
  'Availability runs roughly 500 days ahead. freeBeds is what can actually be booked and is 0 when a hut is unstaffed or full.',
  'Distances are straight-line only: there is no trail routing, walking time, weather or avalanche data here.',
  'Booking is not possible through this server. Hand the user the bookingUrl from get_hut_details, or a create_tour_link URL to review the tour visually.'
].join(' ')

const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INVALID_PARAMS = -32602
const INTERNAL_ERROR = -32603

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400'
}

class RpcError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  })
}

function errorBody(id: string | number | null, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

function initialize(params: Record<string, unknown>) {
  const requested = params.protocolVersion
  const protocolVersion = typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
    ? requested
    : LATEST_PROTOCOL_VERSION

  return {
    protocolVersion,
    capabilities: { tools: { listChanged: false } },
    serverInfo: SERVER_INFO,
    instructions: INSTRUCTIONS
  }
}

async function callTool(params: Record<string, unknown>, context: ToolContext) {
  const name = params.name
  const tool = typeof name === 'string' ? TOOLS_BY_NAME.get(name) : undefined
  if (tool === undefined) {
    throw new RpcError(
      INVALID_PARAMS,
      `Unknown tool "${String(name)}". Available tools: ${TOOLS.map(entry => entry.name).join(', ')}`
    )
  }

  const args = isRecord(params.arguments) ? params.arguments : {}

  let result: unknown
  try {
    result = await tool.handler(args, context)
  } catch (error) {
    if (error instanceof ToolError) {
      throw new RpcError(INVALID_PARAMS, `Invalid arguments for ${tool.name}: ${error.message}`)
    }
    const detail = error instanceof Error ? error.message : String(error)
    return {
      content: [{ type: 'text', text: `${tool.name} failed: ${detail}` }],
      isError: true
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(result) }] }
}

async function dispatch(method: string, params: Record<string, unknown>, context: ToolContext): Promise<unknown> {
  switch (method) {
    case 'initialize':
      return initialize(params)
    case 'ping':
      return {}
    case 'tools/list':
      return {
        tools: TOOLS.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: { readOnlyHint: true, openWorldHint: true }
        }))
      }
    case 'tools/call':
      return callTool(params, context)
    default:
      throw new RpcError(METHOD_NOT_FOUND, `Unknown method: ${method}`)
  }
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (request.method !== 'POST') {
    return new Response('This MCP endpoint accepts POST only and offers no SSE stream.', {
      status: 405,
      headers: { Allow: 'POST, OPTIONS', ...CORS_HEADERS }
    })
  }

  const protocolVersion = request.headers.get('mcp-protocol-version')
  if (protocolVersion !== null && !SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersion)) {
    return jsonResponse(
      errorBody(null, INVALID_REQUEST, `Unsupported MCP-Protocol-Version: ${protocolVersion}`),
      400
    )
  }

  let message: unknown
  try {
    message = await request.json()
  } catch {
    return jsonResponse(errorBody(null, PARSE_ERROR, 'Request body is not valid JSON'), 400)
  }

  if (Array.isArray(message)) {
    return jsonResponse(errorBody(null, INVALID_REQUEST, 'Batched JSON-RPC requests are not supported'), 400)
  }
  if (!isRecord(message)) {
    return jsonResponse(errorBody(null, INVALID_REQUEST, 'Request body must be a JSON-RPC message'), 400)
  }
  if (typeof message.method !== 'string') {
    const isClientResponse = 'result' in message || 'error' in message
    return isClientResponse
      ? new Response(null, { status: 202, headers: CORS_HEADERS })
      : jsonResponse(errorBody(null, INVALID_REQUEST, 'Missing JSON-RPC method'), 400)
  }

  const id = message.id
  if (id === undefined || id === null) {
    return new Response(null, { status: 202, headers: CORS_HEADERS })
  }
  if (typeof id !== 'string' && typeof id !== 'number') {
    return jsonResponse(errorBody(null, INVALID_REQUEST, 'JSON-RPC id must be a string or a number'), 400)
  }

  try {
    const context: ToolContext = { siteOrigin: new URL(request.url).origin }
    const result = await dispatch(message.method, isRecord(message.params) ? message.params : {}, context)
    return jsonResponse({ jsonrpc: '2.0', id, result })
  } catch (error) {
    if (error instanceof RpcError) {
      return jsonResponse(errorBody(id, error.code, error.message))
    }
    const detail = error instanceof Error ? error.message : String(error)
    return jsonResponse(errorBody(id, INTERNAL_ERROR, detail))
  }
}
