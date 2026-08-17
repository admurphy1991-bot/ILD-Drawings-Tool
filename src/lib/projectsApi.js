const ACTIVE_PROJECT_KEY = 'ild_drawings_tool_active_project_v1'

async function parseOrThrow(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function fetchProjects() {
  const res = await fetch('/api/projects')
  return parseOrThrow(res)
}

export async function createProjectApi({ id, job }) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, job }),
  })
  return parseOrThrow(res)
}

export async function updateProjectApi(id, { job, pages }) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job, pages }),
  })
  return parseOrThrow(res)
}

export async function deleteProjectApi(id) {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  return parseOrThrow(res)
}

export function newProjectId() {
  return 'proj_' + Date.now() + Math.random().toString(36).slice(2)
}

export function defaultDateLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// "Last opened project" is a per-device UI preference, not shared project data,
// so it stays in localStorage rather than round-tripping to the database.
export function getLastActiveProjectId() {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY)
  } catch {
    return null
  }
}

export function setLastActiveProjectId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_PROJECT_KEY, id)
    else localStorage.removeItem(ACTIVE_PROJECT_KEY)
  } catch {
    // best-effort only
  }
}
