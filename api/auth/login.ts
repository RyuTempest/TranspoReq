import bcrypt from 'bcryptjs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createToken } from '../_lib/auth'
import { getBody, sendJson, sql } from '../_lib/db'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' })
  try {
    const { username, password } = getBody(request)
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) return sendJson(response, 400, { error: 'Username and password are required' })
    const result = await sql`SELECT id, username, name, password_hash, role FROM users WHERE lower(username) = lower(${username.trim()}) AND status = 'ACTIVE' LIMIT 1`
    const account = result.rows[0]
    if (!account || !(await bcrypt.compare(password, account.password_hash))) return sendJson(response, 401, { error: 'Invalid username or password' })
    const user = { id: Number(account.id), username: account.username, name: account.name, role: account.role as 'ADMIN' | 'USER' }
    const token = await createToken(user)
    sendJson(response, 200, { user, token })
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { error: 'Unable to sign in' })
  }
}
