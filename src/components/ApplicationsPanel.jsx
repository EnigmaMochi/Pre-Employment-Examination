import { useMemo, useState } from 'react'
import { dispositionCategories } from '../data/checklist.js'

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function normalize(value) {
  return (value || '').toString().toLowerCase()
}

export default function ApplicationsPanel({ applications, onPreview, onEdit, onArchive }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = normalize(query).trim()

    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.dispositionCategory !== statusFilter) return false
      if (!q) return true

      const disposition = dispositionCategories.find((c) => c.id === app.dispositionCategory)
      const haystack = [
        app.fullName,
        app.hospitalNumber,
        app.personal?.occupation,
        app.personal?.address,
        disposition?.label,
        disposition?.shortLabel,
      ]
        .map(normalize)
        .join(' ')

      return haystack.includes(q)
    })
  }, [applications, query, statusFilter])

  if (!applications.length) {
    return (
      <div className="applications-empty">
        Every report you save is stored here (in Supabase), so you can revisit or re-print a
        previous applicant&rsquo;s PDF at any time, from any device. Removing one moves it to
        the Archive rather than deleting it.
      </div>
    )
  }

  return (
    <div className="applications-panel">
      <div className="applications-filters">
        <label className="applications-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, hospital no., position…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={200}
          />
          {query && (
            <button
              type="button"
              className="applications-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>

        <select
          className="applications-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All dispositions</option>
          {dispositionCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortLabel}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="applications-empty">
          No applications match &ldquo;{query}&rdquo;{statusFilter !== 'all' ? ' with that disposition' : ''}.
        </div>
      ) : (
        <div className="applications-table">
          <div className="applications-table-head">
            <span>Applicant</span>
            <span>Hospital No.</span>
            <span>Saved</span>
            <span>Disposition</span>
            <span>Actions</span>
          </div>
          {filtered.map((app) => {
            const disposition = dispositionCategories.find((c) => c.id === app.dispositionCategory)
            return (
              <div className="applications-table-row" key={app.id}>
                <span className="applications-name">{app.fullName || 'Unnamed Applicant'}</span>
                <span className="mono">{app.hospitalNumber || '—'}</span>
                <span>{fmtDate(app.savedAt)}</span>
                <span>
                  {disposition ? (
                    <span className={`sidebar-status status-${disposition.id} applications-badge`}>
                      {disposition.shortLabel}
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
                <span className="applications-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPreview(app)}>
                    Preview PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(app)}
                    title="Load this application back into the form to correct it"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-text btn-sm"
                    onClick={() => onArchive(app.id)}
                    title="Move to Archive"
                  >
                    Archive
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}