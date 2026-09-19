import { sql } from '@vercel/postgres'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export { sql }

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.status(status).setHeader('Content-Type', 'application/json').json(body)
}

export function getBody(request: VercelRequest): Record<string, any> {
  if (!request.body) return {}
  if (typeof request.body === 'string') return JSON.parse(request.body)
  return request.body as Record<string, any>
}
