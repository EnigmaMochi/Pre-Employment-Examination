export default function FormSection({ id, eyebrow, title, description, children }) {
  return (
    <section id={id} className="form-section">
      <header className="form-section-head">
        {eyebrow && <span className="form-section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p className="form-section-desc">{description}</p>}
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  )
}
