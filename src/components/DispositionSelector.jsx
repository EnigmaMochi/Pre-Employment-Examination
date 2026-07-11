import { dispositionCategories } from '../data/checklist.js'

export default function DispositionSelector({ selected, note, onSelect, onNoteChange }) {
  const active = dispositionCategories.find((c) => c.id === selected)

  return (
    <div className="disposition">
      <div className="disposition-grid">
        {dispositionCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`disposition-card status-${category.id} ${
              selected === category.id ? 'is-selected' : ''
            }`}
            onClick={() => onSelect(category.id)}
            aria-pressed={selected === category.id}
          >
            <span className="disposition-dot" aria-hidden="true" />
            <span className="disposition-shortlabel">{category.shortLabel}</span>
            <span className="disposition-label">{category.label.replace(/^Class [A-D]:\s*/, '')}</span>
            <span className="disposition-desc">{category.description}</span>
          </button>
        ))}
      </div>

      {active?.requiresNote && (
        <div className="disposition-note">
          <label htmlFor="disposition-note">{active.noteLabel}</label>
          <textarea
            id="disposition-note"
            rows={2}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`Enter ${active.noteLabel.toLowerCase()}...`}
          />
        </div>
      )}
    </div>
  )
}
