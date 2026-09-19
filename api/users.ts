import bcrypt from 'bcryptjs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_lib/auth'
import { getBody, sendJson, sql } from './_lib/db'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const actor = await requireUser(request, response, ['ADMIN'])
  if (!actor) return
  try {
    if (request.method === 'GET') {
      const result = await sql`SELECT id, username, name, role, status, created_at, updated_at FROM users ORDER BY name`
      return sendJson(response, 200, result.rows)
    }
    if (request.method === 'POST') {
      const { username, name, password, role = 'USER' } = getBody(request)
      if (!username?.trim() || !name?.trim() || typeof password !== 'string' || password.length < 8 || !['ADMIN', 'USER'].includes(role)) return sendJson(response, 400, { error: 'Username, name, role, and a password of at least 8 characters are required' })
      const passwordHash = await bcrypt.hash(password, 12)
      const result = await sql`INSERT INTO users (username, name, password_hash, role) VALUES (${username.trim().toLowerCase()}, ${name.trim()}, ${passwordHash}, ${role}) RETURNING id, username, name, role, status, created_at`
      return sendJson(response, 201, result.rows[0])
    }
    const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id
    if (!id) return sendJson(response, 400, { error: 'id is required' })
    if (request.method === 'PATCH') {
      const { name, password, role, status } = getBody(request)
      const passwordHash = password ? await bcrypt.hash(password, 12) : null
      const result = await sql`UPDATE users SET name = COALESCE(${name?.trim() ?? null}, name), password_hash = COALESCE(${passwordHash}, password_hash), role = COALESCE(${role ?? null}, role), status = COALESCE(${status ?? null}, status), updated_at = now() WHERE id = ${id} RETURNING id, username, name, role, status, updated_at`
      return result.rowCount ? sendJson(response, 200, result.rows[0]) : sendJson(response, 404, { error: 'User not found' })
    }
    if (request.method === 'DELETE') {
      if (String(id) === String(actor.id)) return sendJson(response, 400, { error: 'You cannot deactivate your own account' })
      const result = await sql`UPDATE users SET status = 'INACTIVE', updated_at = now() WHERE id = ${id} RETURNING id, username, status`
      return result.rowCount ? sendJson(response, 200, result.rows[0]) : sendJson(response, 404, { error: 'User not found' })
    }
    return sendJson(response, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { error: 'User operation failed' })
  }
}
