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

export default function ArchivePanel({ applications, onPreview, onRestore, onDeleteForever }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmId, setConfirmId] = useState(null)

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
        Nothing archived yet. Applications you remove from the main Applications list show
        up here instead of being deleted, so you can restore or permanently discard them
        later.
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
          No archived applications match &ldquo;{query}&rdquo;
          {statusFilter !== 'all' ? ' with that disposition' : ''}.
        </div>
      ) : (
        <div className="applications-table applications-table-archive">
          <div className="applications-table-head">
            <span>Applicant</span>
            <span>Hospital No.</span>
            <span>Archived</span>
            <span>Disposition</span>
            <span>Actions</span>
          </div>
          {filtered.map((app) => {
            const disposition = dispositionCategories.find((c) => c.id === app.dispositionCategory)
            return (
              <div className="applications-table-row" key={app.id}>
                <span className="applications-name">{app.fullName || 'Unnamed Applicant'}</span>
                <span className="mono">{app.hospitalNumber || '—'}</span>
                <span>{fmtDate(app.archivedAt || app.savedAt)}</span>
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
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRestore(app.id)}>
                    Restore
                  </button>
                  {confirmId === app.id ? (
                    <span className="applications-confirm">
                      <span>Delete Permanently?</span>
                      <button
                        type="button"
                        className="btn btn-text btn-sm btn-danger"
                        onClick={() => {
                          onDeleteForever(app.id)
                          setConfirmId(null)
                        }}
                      >
                        Yes, delete
                      </button>
                      <button type="button" className="btn btn-text btn-sm" onClick={() => setConfirmId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-text btn-sm btn-danger"
                      onClick={() => setConfirmId(app.id)}
                    >
                      Delete Permanently
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
