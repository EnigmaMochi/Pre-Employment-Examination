// Supabase-backed store for saved Pre-Employment applications.
// This replaces the old localStorage-based version. Every time an
// examination report is saved, a snapshot of the full form is pushed into
// the `applications` table (see supabase-schema.sql) so it can be revisited
// or re-printed later — and now shared across devices/browsers instead of
// being stuck in one browser's localStorage.
//
// Applications are never wiped out by the "delete" action on the main
// Applications list — instead they are archived (moved out of the active
// list and flagged with `archived: true`) so they can still be recovered
// or permanently removed later from the dedicated Archive view.
//
// Shape kept identical to the old localStorage version so the rest of the
// app (App.jsx, ApplicationsPanel, ArchivePanel) keeps working with plain
// camelCase objects like { id, hospitalNumber, fullName, personal, vitals,
// ... }. The only difference is every function here now returns a Promise,
// since talking to Supabase is a network call.

import { supabase } from './supabaseClient.js'

const TABLE = 'applications'

// Fields that live inside the `data` JSONB column (everything from
// buildSnapshot() in App.jsx that isn't one of the dedicated columns).
const DATA_FIELDS = [
  'photo',
  'personal',
  'vitals',
  'medicalHistory',
  'femaleHistory',
  'otherHistoryNotes',
  'physicalExam',
  'labResults',
  'screeningResults',
  'diagnosis',
  'dispositionNote',
  'otherDiseaseFindings',
  'examiner',
  'applicantSignature',
  'examinerSignature',
]

// Converts a Supabase row (snake_case columns + `data` jsonb) back into the
// flat camelCase shape the rest of the app expects.
function rowToApp(row) {
  if (!row) return null
  return {
    id: row.id,
    hospitalNumber: row.hospital_number,
    fullName: row.full_name,
    dispositionCategory: row.disposition_category,
    archived: row.archived,
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    ...(row.data || {}),
  }
}

// Converts an app snapshot (as built by buildSnapshot() in App.jsx) into a
// Supabase row payload: known fields become real columns, everything else
// goes into `data`.
function appToRow(snapshot) {
  const data = {}
  DATA_FIELDS.forEach((key) => {
    if (snapshot[key] !== undefined) data[key] = snapshot[key]
  })
  return {
    hospital_number: snapshot.hospitalNumber,
    full_name: snapshot.fullName ?? '',
    disposition_category: snapshot.dispositionCategory ?? 'class_a',
    data,
  }
}

function throwIfError(error, action) {
  if (error) {
    console.error(`[applicationsStore] ${action} failed:`, error)
    throw new Error(error.message || `Failed to ${action}.`)
  }
}

// Fetches every application, active and archived, newest first. Callers
// (App.jsx) keep this in state and derive the active/archived lists from
// it with a filter, rather than re-fetching separately.
export async function fetchAllApplications() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('saved_at', { ascending: false })

  throwIfError(error, 'load applications')
  return (data || []).map(rowToApp)
}

// Inserts a new application record and returns it (including its generated
// id / saved_at timestamp, mapped back to camelCase).
export async function saveApplication(snapshot) {
  const payload = appToRow(snapshot)
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  throwIfError(error, 'save application')
  return rowToApp(data)
}

// Overwrites an existing application record in place (used by the Edit
// action). Returns the updated record.
export async function updateApplication(id, snapshot) {
  const payload = appToRow(snapshot)
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  throwIfError(error, 'update application')
  return rowToApp(data)
}

// Moves an application into the Archive. Returns the updated record.
export async function archiveApplication(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ archived: true, archived_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  throwIfError(error, 'archive application')
  return rowToApp(data)
}

// Moves an application out of the Archive and back into the active list.
// Returns the updated record.
export async function restoreApplication(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ archived: false, archived_at: null })
    .eq('id', id)
    .select()
    .single()

  throwIfError(error, 'restore application')
  return rowToApp(data)
}

// Permanently removes an application. Only ever called from the Archive
// view. Returns the deleted id.
export async function deleteApplication(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  throwIfError(error, 'delete application')
  return id
}