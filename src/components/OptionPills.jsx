// Generic clickable pill toggle, styled like the Yes/No rows, but usable
// for any small set of mutually-exclusive options (e.g. Uncorrected /
// Corrected, Near Sighted / Far Sighted).
export default function OptionPills({ name, options, value, onChange, ariaLabel }) {
  return (
    <div className="check-row-options option-pills" role="radiogroup" aria-label={ariaLabel || name}>
      {options.map((opt, i) => (
        <label
          key={opt.value}
          className={`pill pill-opt-${i % 3} ${value === opt.value ? 'is-active' : ''}`}
        >
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}
