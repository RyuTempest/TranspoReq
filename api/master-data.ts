import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_lib/auth'
import { getBody, sendJson, sql } from './_lib/db'

const resources = {
  departments: 'departments',
  positions: 'positions',
  locations: 'locations',
  modes: 'transportation_modes',
} as const

type Resource = keyof typeof resources
function resource(value: unknown): Resource | null { return typeof value === 'string' && value in resources ? value as Resource : null }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response)
  if (!user) return
  const kind = resource(request.query.resource)
  if (!kind) return sendJson(response, 400, { error: 'resource must be departments, positions, locations, or modes' })
  const table = resources[kind]
  try {
    if (request.method === 'GET') {
      const result = await sql.query(`SELECT id, name, status, created_at FROM ${table} ORDER BY name`, [])
      return sendJson(response, 200, result.rows)
    }
    if (user.role !== 'ADMIN') return sendJson(response, 403, { error: 'Admin access required' })
    if (request.method === 'POST') {
      const { name } = getBody(request)
      if (typeof name !== 'string' || !name.trim()) return sendJson(response, 400, { error: 'Name is required' })
      const result = await sql.query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING id, name, status, created_at`, [name.trim()])
      return sendJson(response, 201, result.rows[0])
    }
    if (request.method === 'PATCH') {
      const { id, name, status } = getBody(request)
      if (!id || (typeof name !== 'string' && typeof status !== 'string')) return sendJson(response, 400, { error: 'id and a field to update are required' })
      const result = await sql.query(`UPDATE ${table} SET name = COALESCE($1, name), status = COALESCE($2, status) WHERE id = $3 RETURNING id, name, status, created_at`, [name?.trim() ?? null, status ?? null, id])
      return result.rowCount ? sendJson(response, 200, result.rows[0]) : sendJson(response, 404, { error: 'Record not found' })
    }
    if (request.method === 'DELETE') {
      const id = request.query.id
      if (!id) return sendJson(response, 400, { error: 'id is required' })
      const result = await sql.query(`UPDATE ${table} SET status = 'INACTIVE' WHERE id = $1 RETURNING id, name, status`, [id])
      return result.rowCount ? sendJson(response, 200, result.rows[0]) : sendJson(response, 404, { error: 'Record not found' })
    }
    return sendJson(response, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { error: 'Master data operation failed' })
  }
}
