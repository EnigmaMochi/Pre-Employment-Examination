import {
  medicalHistoryColumns,
  personalSocialHistoryColumns,
  physicalExamColumns,
  xrayLabItems,
  screeningTests,
  dispositionCategories,
} from '../data/checklist.js'

function fmtStatus(status) {
  if (status === 'not_done') return 'Not Done'
  if (status === 'abnormal') return 'Abnormal'
  if (status === 'normal') return 'Normal'
  return '—'
}

// Renders a clean, print-ready version of a saved application snapshot.
// Used both for the live "current form" preview and for re-printing a
// record loaded from the Applications list. Rendered off-screen and
// captured with html2canvas to build the PDF.
export default function PrintableReport({ data }) {
  if (!data) return null
  const {
    hospitalNumber,
    fullName,
    photo,
    personal = {},
    vitals = {},
    medicalHistory = {},
    femaleHistory = {},
    otherHistoryNotes,
    physicalExam = {},
    labResults = {},
    screeningResults = {},
    diagnosis,
    dispositionCategory,
    dispositionNote,
    otherDiseaseFindings,
    examiner = {},
    applicantSignature,
    examinerSignature,
  } = data

  const activeDisposition = dispositionCategories.find((c) => c.id === dispositionCategory)

  return (
    <div className="printable-report">
      <div className="pr-letterhead">
        <div>
          <h1>E. Zarate Hospital</h1>
          <p>Pre-Employment Medical Examination Report</p>
        </div>
        <div className="pr-letterhead-meta">
          <span>Hospital No.</span>
          <strong>{hospitalNumber}</strong>
        </div>
      </div>

      <div className="pr-top">
        {photo && (
          <div className="pr-photo">
            <img src={photo} alt="Applicant" />
          </div>
        )}
        <table className="pr-table">
          <tbody>
            <tr>
              <th>Name</th>
              <td>{fullName || '—'}</td>
              <th>Age / Gender</th>
              <td>{personal.age || '—'} / {personal.gender || '—'}</td>
            </tr>
            <tr>
              <th>Address</th>
              <td colSpan={3}>{personal.address || '—'}</td>
            </tr>
            <tr>
              <th>Civil Status</th>
              <td>{personal.civilStatus || '—'}</td>
              <th>Date of Birth</th>
              <td>{personal.dob || '—'}</td>
            </tr>
            <tr>
              <th>Occupation</th>
              <td>{personal.occupation || '—'}</td>
              <th>Exam Date</th>
              <td>{personal.examDate || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="pr-section">
        <h2>Medical History</h2>
        <div className="pr-cols">
          {medicalHistoryColumns.map((col) => (
            <div key={col.heading}>
              <h3>{col.heading}</h3>
              <ul>
                {col.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.label}</span>
                    <strong>{(medicalHistory[item.id] || '—').toUpperCase()}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pr-cols">
          {personalSocialHistoryColumns.map((col) => (
            <div key={col.heading}>
              <h3>{col.heading}</h3>
              <ul>
                {col.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.label}</span>
                    <strong>{(medicalHistory[item.id] || '—').toUpperCase()}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {personal.gender === 'female' && (
          <p className="pr-line">
            Obstetrical Score: {femaleHistory.obstetricalScore || '—'} &nbsp;|&nbsp; LMP: {femaleHistory.lmp || '—'}
          </p>
        )}
        {otherHistoryNotes && <p className="pr-line">Other history: {otherHistoryNotes}</p>}
      </section>

      <section className="pr-section">
        <h2>Vital Signs & Sensory Screening</h2>
        <p className="pr-line">
          BP: {vitals.bp || '—'} &nbsp;|&nbsp; Pulse: {vitals.pulse || '—'} &nbsp;|&nbsp; RR: {vitals.respRate || '—'} &nbsp;|&nbsp;
          Temp: {vitals.temp || '—'} &nbsp;|&nbsp; Height: {vitals.height || '—'} &nbsp;|&nbsp; Weight: {vitals.weight || '—'} &nbsp;|&nbsp; Build: {vitals.build || '—'}
        </p>
        <p className="pr-line">
          Visual Acuity — Far Sighted ({vitals.visualAcuityFarMode === 'corrected' ? 'Corrected' : 'Uncorrected'}): OD{' '}
          {vitals.visualAcuityFarOD || '—'}, OS {vitals.visualAcuityFarOS || '—'}
          &nbsp;|&nbsp; Near Sighted ({vitals.visualAcuityNearMode === 'corrected' ? 'Corrected' : 'Uncorrected'}): OD{' '}
          {vitals.visualAcuityNearOD || '—'}, OS {vitals.visualAcuityNearOS || '—'}
        </p>
        <p className="pr-line">
          Color Vision: {vitals.colorVision || '—'} (Score: {vitals.colorVisionScore || '—'})
        </p>
        <p className="pr-line">
          Hearing AD: {vitals.hearingAD || '—'} (Score: {vitals.hearingADScore || '—'}) &nbsp;|&nbsp;
          Hearing AS: {vitals.hearingAS || '—'} (Score: {vitals.hearingASScore || '—'})
        </p>
      </section>

      <section className="pr-section">
        <h2>Physical Examination Findings</h2>
        <div className="pr-cols">
          {physicalExamColumns.map((col) => (
            <div key={col.heading}>
              <h3>{col.heading}</h3>
              <ul>
                {col.items.map((item) => {
                  const v = physicalExam[item.id] || {}
                  return (
                    <li key={item.id}>
                      <span>{item.label}</span>
                      <strong>
                        {fmtStatus(v.status)}
                        {v.status === 'abnormal' && v.note ? ` — ${v.note}` : ''}
                      </strong>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-section">
        <h2>X-Ray, ECG & Laboratory Examinations</h2>
        <ul>
          {xrayLabItems.map((item) => {
            const v = labResults[item.id] || {}
            return (
              <li key={item.id}>
                <span>{item.label}</span>
                <strong>
                  {fmtStatus(v.status)}
                  {v.status === 'abnormal' && v.note ? ` — ${v.note}` : ''}
                </strong>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="pr-section">
        <h2>Screening Tests</h2>
        <ul>
          {screeningTests.map((item) => (
            <li key={item.id}>
              <span>{item.label}</span>
              <strong>{(screeningResults[item.id] || '—').toString().toUpperCase()}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="pr-section">
        <h2>Diagnosis / Remarks</h2>
        <p className="pr-line">{diagnosis || '—'}</p>
      </section>

      <section className="pr-section">
        <h2>Disposition</h2>
        <p className="pr-line">
          <strong>{activeDisposition ? activeDisposition.label : '—'}</strong>
        </p>
        {dispositionNote && <p className="pr-line">Note: {dispositionNote}</p>}
        {otherDiseaseFindings && (
          <p className="pr-line">Other Disease / Findings: {otherDiseaseFindings}</p>
        )}
      </section>

      <section className="pr-section pr-signoff">
        <table className="pr-table">
          <tbody>
            <tr>
              <th>Examining Physician</th>
              <td>{examiner.name || '—'}</td>
            </tr>
            <tr>
              <th>Medical Examiner Reg. No.</th>
              <td>{examiner.licenseNo || '—'}</td>
            </tr>
          </tbody>
        </table>
        <div className="pr-signatures">
          <div>
            {applicantSignature && <img src={applicantSignature} alt="Applicant signature" />}
            <p>Applicant&rsquo;s Signature</p>
          </div>
          <div>
            {examinerSignature && <img src={examinerSignature} alt="Examiner signature" />}
            <p>Examiner&rsquo;s Signature</p>
          </div>
        </div>
      </section>

      <p className="pr-footer">Valid for six (6) months only from date of examination.</p>
    </div>
  )
}
