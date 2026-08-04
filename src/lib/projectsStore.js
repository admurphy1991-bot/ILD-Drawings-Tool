const STORAGE_KEY = 'ild_drawings_tool_projects_v1'

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { activeProjectId: null, projects: {} }
    const parsed = JSON.parse(raw)
    return { activeProjectId: parsed.activeProjectId || null, projects: parsed.projects || {} }
  } catch {
    return { activeProjectId: null, projects: {} }
  }
}

export function persistStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // autosave is a safety net, not a hard requirement
  }
}

export function newProjectId() {
  return 'proj_' + Date.now() + Math.random().toString(36).slice(2)
}

export function defaultDateLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
