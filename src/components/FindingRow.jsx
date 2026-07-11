export default function FindingRow({ item, value, onChange, notePlaceholder }) {
  const isAbnormal = value.status === 'abnormal'
  const isNotDone = value.status === 'not_done'

  return (
    <div className="finding-row">
      <span className="check-row-label">{item.label}</span>
      <div className="finding-row-right">
        <div className="check-row-options" role="radiogroup" aria-label={item.label}>
          <label className={`pill pill-no ${value.status === 'normal' ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={item.id}
              checked={value.status === 'normal'}
              onChange={() => onChange(item.id, { ...value, status: 'normal' })}
            />
            Normal
          </label>
          <label className={`pill pill-yes ${isAbnormal ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={item.id}
              checked={isAbnormal}
              onChange={() => onChange(item.id, { ...value, status: 'abnormal' })}
            />
            Abnormal
          </label>
          <label className={`pill pill-neutral ${isNotDone ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={item.id}
              checked={isNotDone}
              onChange={() => onChange(item.id, { ...value, status: 'not_done', note: '' })}
            />
            Not Done
          </label>
        </div>
        {isAbnormal && (
          <input
            type="text"
            className="finding-note"
            placeholder={notePlaceholder || 'Describe finding'}
            value={value.note || ''}
            onChange={(e) => onChange(item.id, { ...value, note: e.target.value })}
            autoFocus
          />
        )}
      </div>
    </div>
  )
}
