export default function YesNoRow({ item, value, onChange }) {
  return (
    <div className="check-row">
      <span className="check-row-label">{item.label}</span>
      <div className="check-row-options" role="radiogroup" aria-label={item.label}>
        <label className={`pill pill-no ${value === 'no' ? 'is-active' : ''}`}>
          <input
            type="radio"
            name={item.id}
            checked={value === 'no'}
            onChange={() => onChange(item.id, 'no')}
          />
          No
        </label>
        <label className={`pill pill-yes ${value === 'yes' ? 'is-active' : ''}`}>
          <input
            type="radio"
            name={item.id}
            checked={value === 'yes'}
            onChange={() => onChange(item.id, 'yes')}
          />
          Yes
        </label>
      </div>
    </div>
  )
}
