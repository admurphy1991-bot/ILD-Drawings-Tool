import { sql } from '../_db.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const { job, pages } = req.body || {}
    if (!job || !pages) return res.status(400).json({ error: 'job and pages are required' })
    const { rows } = await sql`
      UPDATE projects
      SET job = ${JSON.stringify(job)}::jsonb, pages = ${JSON.stringify(pages)}::jsonb, updated_at = now()
      WHERE id = ${id}
      RETURNING id, job, pages, created_at AS "createdAt", updated_at AS "updatedAt"
    `
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(rows[0])
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM projects WHERE id = ${id}`
    return res.status(204).end()
  }

  res.setHeader('Allow', 'PUT, DELETE')
  return res.status(405).end('Method Not Allowed')
}
