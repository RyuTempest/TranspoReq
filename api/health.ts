import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson, sql } from './_lib/db'

export default async function handler(_request: VercelRequest, response: VercelResponse) {
  try {
    await sql`SELECT 1`
    sendJson(response, 200, { ok: true, database: 'connected' })
  } catch (error) {
    console.error(error)
    sendJson(response, 503, { ok: false, database: 'unavailable' })
  }
}
