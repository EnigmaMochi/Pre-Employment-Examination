import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'history', label: 'Medical History' },
  { id: 'exam', label: 'Physical Exam' },
  { id: 'labs', label: 'X-Ray & Lab' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'disposition', label: 'Disposition' },
  { id: 'applications', label: 'Applications' },
  { id: 'signoff', label: 'Sign-off' },
]

export default function PatientSidebar({
  photo,
  hospitalNumber,
  onRegenerate,
  name,
  status,
  view,
  onNavigateSection,
  onOpenArchive,
  archiveCount,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id) => {
    onNavigateSection(id)
    setMenuOpen(false)
  }

  const openArchive = () => {
    onOpenArchive()
    setMenuOpen(false)
  }

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="nav-burger"
        aria-label={menuOpen ? 'Close section menu' : 'Open section menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="nav-burger-bar" />
        <span className="nav-burger-bar" />
        <span className="nav-burger-bar" />
      </button>

      <div className="sidebar-card">
        <div className="sidebar-photo">
          {photo ? (
            <img src={photo} alt="Applicant" />
          ) : (
            <span className="sidebar-photo-fallback">Photo</span>
          )}
        </div>
        <p className="sidebar-name">{name || 'Applicant Name'}</p>
        <p className="sidebar-role">Pre-Employment Examination</p>

        <div className="sidebar-hn">
          <span className="sidebar-hn-label">Hospital No.</span>
          <div className="sidebar-hn-row">
            <span className="sidebar-hn-value">{hospitalNumber}</span>
            <button type="button" className="sidebar-hn-refresh" onClick={onRegenerate} title="Generate new number">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                />
              </svg>
            </button>
          </div>
        </div>

        {status && (
          <span className={`sidebar-status status-${status}`}>
            {status === 'class_a' && 'Class A: Fit W/O Restriction'}
            {status === 'class_b' && 'Class B: Fit W/ Minor Defect'}
            {status === 'class_c' && 'Class C: Employable, Significant'}
            {status === 'class_d' && 'Class D: Unfit'}
          </span>
        )}
      </div>

      <nav className={`sidebar-nav${menuOpen ? ' is-open' : ''}`}>
        <span className="sidebar-nav-title">Sections</span>
        {NAV_ITEMS.map((item) => (
          <button key={item.id} type="button" onClick={() => scrollTo(item.id)}>
            {item.label}
          </button>
        ))}

        <div className="sidebar-nav-divider" role="separator" />

        <span className="sidebar-nav-title">Workspace</span>
        <button
          type="button"
          className={`sidebar-nav-archive${view === 'archive' ? ' is-active' : ''}`}
          onClick={openArchive}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.54 5.23 19.15 3.55A1.5 1.5 0 0 0 18 3H6a1.5 1.5 0 0 0-1.15.55L3.46 5.23A1.5 1.5 0 0 0 3 6.3V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.3a1.5 1.5 0 0 0-.46-1.07ZM6.35 5h11.3l.62.75H5.73L6.35 5ZM5 18V7.5h14V18Zm4.5-7.5a1 1 0 0 0 1 1h3a1 1 0 0 0 0-2h-3a1 1 0 0 0-1 1Z"
            />
          </svg>
          <span>Archive</span>
          {archiveCount > 0 && <span className="sidebar-nav-archive-count">{archiveCount}</span>}
        </button>
      </nav>

      {menuOpen && <div className="nav-burger-backdrop" onClick={() => setMenuOpen(false)} />}
    </aside>
  )
}
