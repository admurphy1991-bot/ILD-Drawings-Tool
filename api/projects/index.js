import { sql } from '../_db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT id, job, pages, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM projects ORDER BY updated_at DESC
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { id, job } = req.body || {}
    if (!id || !job) return res.status(400).json({ error: 'id and job are required' })
    const { rows } = await sql`
      INSERT INTO projects (id, job, pages)
      VALUES (${id}, ${JSON.stringify(job)}::jsonb, '[]'::jsonb)
      RETURNING id, job, pages, created_at AS "createdAt", updated_at AS "updatedAt"
    `
    return res.status(201).json(rows[0])
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).end('Method Not Allowed')
}
