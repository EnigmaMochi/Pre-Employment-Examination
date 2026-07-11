// Simple localStorage-backed store for saved Pre-Employment applications.
// Every time an examination report is saved, a snapshot of the full form
// is pushed into this store so it can be revisited or re-printed later.
//
// Applications are never wiped out by the "delete" action on the main
// Applications list — instead they are archived (moved out of the active
// list and flagged with `archived: true`) so they can still be recovered
// or permanently removed later from the dedicated Archive view.

const STORAGE_KEY = 'peme_applications'

function safeParse(json) {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Internal: full raw list, active + archived.
function getAllApplications() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  return safeParse(raw)
}

function persist(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// Active (non-archived) applications only — this is what the main
// "Applications" list on the form shows.
export function getApplications() {
  return getAllApplications().filter((app) => !app.archived)
}

// Archived applications only — this is what the dedicated Archive view
// in the sidebar shows.
export function getArchivedApplications() {
  return getAllApplications().filter((app) => app.archived)
}

// Every application saved, active and archived — used for things like
// making sure a newly generated hospital number never collides with one
// already in use, even by an archived record.
export function getAllApplicationsIncludingArchived() {
  return getAllApplications()
}

// Adds a new application record to the front of the list and returns it
// (including its generated id / savedAt timestamp).
export function saveApplication(snapshot) {
  const list = getAllApplications()
  const record = {
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    archived: false,
    ...snapshot,
  }
  const next = [record, ...list]
  persist(next)
  return record
}

// Moves an application out of the active Applications list and into the
// Archive. Returns the updated active list.
export function archiveApplication(id) {
  const next = getAllApplications().map((app) =>
    app.id === id ? { ...app, archived: true, archivedAt: new Date().toISOString() } : app
  )
  persist(next)
  return next.filter((app) => !app.archived)
}

// Moves an application out of the Archive and back into the active
// Applications list. Returns the updated archived list.
export function restoreApplication(id) {
  const next = getAllApplications().map((app) =>
    app.id === id ? { ...app, archived: false, archivedAt: null } : app
  )
  persist(next)
  return next.filter((app) => app.archived)
}

// Permanently removes an application. Only ever called from the Archive
// view — the active Applications list only ever archives, never deletes.
// Returns the updated archived list.
export function deleteApplication(id) {
  const next = getAllApplications().filter((app) => app.id !== id)
  persist(next)
  return next.filter((app) => app.archived)
}

// Overwrites an existing application record in place (used by the Edit
// action on the Applications list) without changing its id, savedAt, or
// archived status. Adds/updates an `updatedAt` timestamp. Returns the
// updated active (non-archived) list, since editing only ever happens
// from the active Applications list.
export function updateApplication(id, snapshot) {
  const next = getAllApplications().map((app) =>
    app.id === id ? { ...app, ...snapshot, id: app.id, savedAt: app.savedAt, updatedAt: new Date().toISOString() } : app
  )
  persist(next)
  return next.filter((app) => !app.archived)
}

export function clearApplications() {
  persist([])
}
