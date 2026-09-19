import { jwtVerify, SignJWT } from 'jose'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson } from './db'

export type AuthUser = { id: number; username: string; name: string; role: 'ADMIN' | 'USER' }

function secret() {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(value)
}

export async function createToken(user: AuthUser) {
  return new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret())
}

export async function getAuthUser(request: VercelRequest): Promise<AuthUser | null> {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.id || !payload.username || !payload.role) return null
    return { id: Number(payload.id), username: String(payload.username), name: String(payload.name ?? ''), role: payload.role as AuthUser['role'] }
  } catch {
    return null
  }
}

export async function requireUser(request: VercelRequest, response: VercelResponse, roles?: AuthUser['role'][]) {
  const user = await getAuthUser(request)
  if (!user) { sendJson(response, 401, { error: 'Authentication required' }); return null }
  if (roles && !roles.includes(user.role)) { sendJson(response, 403, { error: 'Insufficient permissions' }); return null }
  return user
}
