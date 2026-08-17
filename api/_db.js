import { neon } from '@neondatabase/serverless'

// Vercel's Postgres storage is now a native Neon integration; the dashboard's
// "Quickstart" snippet shows the exact env var name it provisions (usually
// DATABASE_URL) — check both in case it's set up under the older name.
// fullResults keeps the { rows } shape used throughout the /api handlers.
export const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL, { fullResults: true })
