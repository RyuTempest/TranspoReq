import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from './_lib/auth'
import { getBody, sendJson, sql } from './_lib/db'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const result = await sql`
        SELECT f.id, f.tft_no, f.date_filed, f.purpose, f.status, f.grand_total,
               e.name AS employee, d.name AS department, f.created_at, f.updated_at
        FROM tft_forms f
        JOIN employees e ON e.id = f.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE f.archived_at IS NULL
        ORDER BY f.created_at DESC
      `
      return sendJson(response, 200, result.rows)
    }
    if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' })
    const { employee_id, date_filed, purpose, rows = [] } = getBody(request)
    if (!employee_id || !date_filed || typeof purpose !== 'string' || !purpose.trim() || !Array.isArray(rows)) return sendJson(response, 400, { error: 'employee_id, date_filed, purpose, and rows are required' })
    if (rows.some((row: any) => !row.travel_date || !row.from_location_id || !row.to_location_id || !row.transportation_mode_id || !Number.isInteger(row.number_of_trips) || row.number_of_trips <= 0 || Number(row.unit_fare) < 0)) return sendJson(response, 400, { error: 'Every transportation row must contain valid route, date, trips, and fare values' })
    const number = await sql`SELECT nextval('tft_number_seq') AS value`
    const tftNo = `TFT-${String(number.rows[0].value).padStart(6, '0')}`
    const form = await sql`INSERT INTO tft_forms (tft_no, employee_id, date_filed, purpose, created_by, updated_by) VALUES (${tftNo}, ${employee_id}, ${date_filed}, ${purpose.trim()}, ${user.id}, ${user.id}) RETURNING id, tft_no`
    for (const row of rows) {
      await sql`INSERT INTO tft_transport_rows (tft_id, travel_date, from_location_id, to_location_id, transportation_mode_id, number_of_trips, unit_fare) VALUES (${form.rows[0].id}, ${row.travel_date}, ${row.from_location_id}, ${row.to_location_id}, ${row.transportation_mode_id}, ${row.number_of_trips}, ${row.unit_fare})`
    }
    await sql`UPDATE tft_forms SET grand_total = COALESCE((SELECT SUM(total_amount) FROM tft_transport_rows WHERE tft_id = ${form.rows[0].id}), 0) WHERE id = ${form.rows[0].id}`
    await sql`INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES (${user.id}, 'CREATE', 'tft_forms', ${String(form.rows[0].id)})`
    sendJson(response, 201, form.rows[0])
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { error: 'TFT operation failed' })
  }
}