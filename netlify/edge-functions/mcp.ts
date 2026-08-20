import { handleMcpRequest } from '../mcp/protocol.ts'

export default async (request: Request) => handleMcpRequest(request)

export const config = {
  path: '/mcp'
}
