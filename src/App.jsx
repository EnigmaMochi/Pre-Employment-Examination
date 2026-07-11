import { useEffect, useMemo, useRef, useState } from 'react'
import PatientSidebar from './components/PatientSidebar.jsx'
import PhotoCapture from './components/PhotoCapture.jsx'
import SignaturePad from './components/SignaturePad.jsx'
import FormSection from './components/FormSection.jsx'
import YesNoRow from './components/YesNoRow.jsx'
import FindingRow from './components/FindingRow.jsx'
import OptionPills from './components/OptionPills.jsx'
import DispositionSelector from './components/DispositionSelector.jsx'
import ApplicationsPanel from './components/ApplicationsPanel.jsx'
import ArchivePanel from './components/ArchivePanel.jsx'
import PdfPreviewModal from './components/PdfPreviewModal.jsx'
import hospitalLogo from './assets/logozarat-transparent.png'

import {
  medicalHistoryColumns,
  personalSocialHistoryColumns,
  physicalExamColumns,
  xrayLabItems,
  screeningTests,
} from './data/checklist.js'
import { generateNextHospitalNumber } from './utils/generateHospitalNumber.js'
import {
  fetchAllApplications,
  saveApplication,
  updateApplication,
  archiveApplication,
  restoreApplication,
  deleteApplication,
} from './utils/applicationsStore.js'
import './App.css'

const emptyFinding = { status: '', note: '' }

function initFindings(columns) {
  const map = {}
  columns.forEach((col) => col.items.forEach((item) => (map[item.id] = { ...emptyFinding })))
  return map
}

function initLabMap(items) {
  const map = {}
  items.forEach((item) => (map[item.id] = ''))
  return map
}

function createDefaultPersonal() {
  return {
    surname: '',
    given: '',
    mi: '',
    address: '',
    gender: '',
    age: '',
    civilStatus: '',
    dob: '',
    occupation: '',
    examDate: new Date().toISOString().slice(0, 10),
  }
}

function createDefaultVitals() {
  return {
    bp: '',
    pulse: '',
    respRate: '',
    temp: '',
    height: '',
    weight: '',
    build: '',
    visualAcuityFarMode: 'uncorrected',
    visualAcuityFarOD: '',
    visualAcuityFarOS: '',
    visualAcuityNearMode: 'uncorrected',
    visualAcuityNearOD: '',
    visualAcuityNearOS: '',
    colorVision: 'normal',
    colorVisionScore: '',
    hearingAD: 'normal',
    hearingADScore: '',
    hearingAS: 'normal',
    hearingASScore: '',
  }
}

function createDefaultExaminer() {
  return { name: '', licenseNo: '' }
}

// Pulls the list of hospital numbers already in use (active + archived) out
// of whatever application list is currently in state, so a newly generated
// number never collides with one already saved in Supabase.
function existingHospitalNumbers(list) {
  return list.map((app) => app.hospitalNumber).filter(Boolean)
}

function App() {
  // Hospital number can't be computed until the saved applications have
  // been fetched from Supabase (we need to know which numbers are already
  // in use), so it starts blank and is filled in once loading finishes.
  const [hospitalNumber, setHospitalNumber] = useState('')
  const [photo, setPhoto] = useState(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Which "window" is on screen: the examination form, or the separate
  // Archive workspace. These are distinct views — the sidebar's Archive
  // entry lives apart from the scrolling form Sections above it.
  const [view, setView] = useState('form')
  const pendingScrollId = useRef(null)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Use the hospital logo as the browser tab favicon.
  useEffect(() => {
    const existingIcons = document.querySelectorAll("link[rel*='icon']")
    existingIcons.forEach((el) => el.parentNode?.removeChild(el))

    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = hospitalLogo
    document.head.appendChild(link)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // When a Section link is clicked while the Archive workspace is open,
  // switch back to the form first, then scroll once it's mounted.
  useEffect(() => {
    if (view === 'form' && pendingScrollId.current) {
      const id = pendingScrollId.current
      pendingScrollId.current = null
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [view])

  const goToSection = (id) => {
    if (view !== 'form') {
      pendingScrollId.current = id
      setView('form')
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const openArchive = () => {
    setView('archive')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToForm = () => {
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [personal, setPersonal] = useState(createDefaultPersonal)

  const [vitals, setVitals] = useState(createDefaultVitals)

  const [medicalHistory, setMedicalHistory] = useState({})
  const [femaleHistory, setFemaleHistory] = useState({ obstetricalScore: '', lmp: '' })
  const [otherHistoryNotes, setOtherHistoryNotes] = useState('')

  const [physicalExam, setPhysicalExam] = useState(() =>
    initFindings(physicalExamColumns)
  )

  const [labResults, setLabResults] = useState(() => initFindings([{ items: xrayLabItems }]))
  const [screeningResults, setScreeningResults] = useState(() => initLabMap(screeningTests))

  const [diagnosis, setDiagnosis] = useState('')
  const [dispositionCategory, setDispositionCategory] = useState('class_a')
  const [dispositionNote, setDispositionNote] = useState('')
  const [otherDiseaseFindings, setOtherDiseaseFindings] = useState('')

  const [examiner, setExaminer] = useState(createDefaultExaminer)
  const [applicantSignature, setApplicantSignature] = useState(null)
  const [examinerSignature, setExaminerSignature] = useState(null)

  // Tracks the id of an application currently being edited (loaded back
  // into the form from the Applications list). Null while creating a new
  // report from scratch.
  const [editingId, setEditingId] = useState(null)

  // Shown as a banner right after a save/update completes. Null the rest
  // of the time.
  const [saveNotice, setSaveNotice] = useState(null)

  // Master list of every application (active + archived) as fetched from
  // Supabase. The active/archived lists shown in the UI are just filtered
  // views of this one array, so we don't have to keep multiple copies in
  // sync by hand.
  const [allApplications, setAllApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [applicationsError, setApplicationsError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pdfPreviewData, setPdfPreviewData] = useState(null)

  const applications = useMemo(
    () => allApplications.filter((app) => !app.archived),
    [allApplications]
  )
  const archivedApplications = useMemo(
    () => allApplications.filter((app) => app.archived),
    [allApplications]
  )

  // Load every saved application from Supabase once on mount, then work out
  // the first available hospital number now that we know what's in use.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setApplicationsLoading(true)
      setApplicationsError(null)
      try {
        const list = await fetchAllApplications()
        if (cancelled) return
        setAllApplications(list)
        setHospitalNumber(generateNextHospitalNumber(existingHospitalNumbers(list)))
      } catch (err) {
        if (cancelled) return
        console.error(err)
        setApplicationsError(
          err.message || 'Could not load saved applications from Supabase.'
        )
        // Still let the form work even if Supabase is unreachable.
        setHospitalNumber(generateNextHospitalNumber([]))
      } finally {
        if (!cancelled) setApplicationsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const fullName = useMemo(() => {
    const parts = [personal.given, personal.mi, personal.surname].filter(Boolean)
    return parts.join(' ')
  }, [personal])

  const updatePersonal = (field, value) => setPersonal((p) => ({ ...p, [field]: value }))
  const updateVitals = (field, value) => setVitals((v) => ({ ...v, [field]: value }))
  const updateHistory = (id, value) => setMedicalHistory((h) => ({ ...h, [id]: value }))
  const updateFinding = (id, value) => setPhysicalExam((f) => ({ ...f, [id]: value }))
  const updateLabFinding = (id, value) => setLabResults((f) => ({ ...f, [id]: value }))
  const updateLab = (map, setMap, id, value) => setMap({ ...map, [id]: value })

  const buildSnapshot = () => ({
    hospitalNumber,
    fullName,
    photo,
    personal,
    vitals,
    medicalHistory,
    femaleHistory,
    otherHistoryNotes,
    physicalExam,
    labResults,
    screeningResults,
    diagnosis,
    dispositionCategory,
    dispositionNote,
    otherDiseaseFindings,
    examiner,
    applicantSignature,
    examinerSignature,
  })

  // Wipes every field back to a blank form. Called after a successful
  // save so the next applicant can be started without manually clearing
  // out the previous applicant's inputs first.
  const resetForm = ({ nextHospitalNumber } = {}) => {
    setHospitalNumber(
      nextHospitalNumber ?? generateNextHospitalNumber(existingHospitalNumbers(allApplications))
    )
    setPhoto(null)
    setPersonal(createDefaultPersonal())
    setVitals(createDefaultVitals())
    setMedicalHistory({})
    setFemaleHistory({ obstetricalScore: '', lmp: '' })
    setOtherHistoryNotes('')
    setPhysicalExam(initFindings(physicalExamColumns))
    setLabResults(initFindings([{ items: xrayLabItems }]))
    setScreeningResults(initLabMap(screeningTests))
    setDiagnosis('')
    setDispositionCategory('class_a')
    setDispositionNote('')
    setOtherDiseaseFindings('')
    setExaminer(createDefaultExaminer())
    setApplicantSignature(null)
    setExaminerSignature(null)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    setApplicationsError(null)

    try {
      if (editingId) {
        // Editing an existing application: overwrite it in place and keep
        // its original hospital number rather than generating a new one.
        const updated = await updateApplication(editingId, { ...buildSnapshot(), hospitalNumber })
        setAllApplications((list) => list.map((app) => (app.id === editingId ? updated : app)))
        setSaveNotice({ mode: 'updated', hospitalNumber, dispositionCategory })
        resetForm()
      } else {
        // Assign the next sequential hospital number (001, 002, 003, ...) with
        // today's real date, guaranteed not to clash with any number already
        // used by a previously saved application.
        const currentHospitalNumber = generateNextHospitalNumber(
          existingHospitalNumbers(allApplications)
        )
        const saved = await saveApplication({
          ...buildSnapshot(),
          hospitalNumber: currentHospitalNumber,
        })
        setAllApplications((list) => [saved, ...list])
        setSaveNotice({ mode: 'created', hospitalNumber: currentHospitalNumber, dispositionCategory })
        resetForm()
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
      setApplicationsError(err.message || 'Could not save this report to Supabase.')
    } finally {
      setIsSaving(false)
    }
  }

  // Loads a saved application's data back into the form so it can be
  // corrected and re-saved, in case of a wrong or missing entry.
  const handleEditApplication = (app) => {
    setHospitalNumber(app.hospitalNumber || hospitalNumber)
    setPhoto(app.photo ?? null)
    setPersonal({ ...createDefaultPersonal(), ...app.personal })
    setVitals({ ...createDefaultVitals(), ...app.vitals })
    setMedicalHistory(app.medicalHistory ?? {})
    setFemaleHistory(app.femaleHistory ?? { obstetricalScore: '', lmp: '' })
    setOtherHistoryNotes(app.otherHistoryNotes ?? '')
    setPhysicalExam({ ...initFindings(physicalExamColumns), ...app.physicalExam })
    setLabResults({ ...initFindings([{ items: xrayLabItems }]), ...app.labResults })
    setScreeningResults({ ...initLabMap(screeningTests), ...app.screeningResults })
    setDiagnosis(app.diagnosis ?? '')
    setDispositionCategory(app.dispositionCategory ?? 'class_a')
    setDispositionNote(app.dispositionNote ?? '')
    setOtherDiseaseFindings(app.otherDiseaseFindings ?? '')
    setExaminer({ ...createDefaultExaminer(), ...app.examiner })
    setApplicantSignature(app.applicantSignature ?? null)
    setExaminerSignature(app.examinerSignature ?? null)
    setEditingId(app.id)
    setSaveNotice(null)
    setView('form')
    requestAnimationFrame(() => {
      document.getElementById('personal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  // Removing an application from the active list no longer deletes it —
  // it moves to the Archive workspace instead.
  const handleArchiveApplication = async (id) => {
    try {
      const updated = await archiveApplication(id)
      setAllApplications((list) => list.map((app) => (app.id === id ? updated : app)))
    } catch (err) {
      console.error(err)
      setApplicationsError(err.message || 'Could not archive this application.')
    }
  }

  const handleRestoreApplication = async (id) => {
    try {
      const updated = await restoreApplication(id)
      setAllApplications((list) => list.map((app) => (app.id === id ? updated : app)))
    } catch (err) {
      console.error(err)
      setApplicationsError(err.message || 'Could not restore this application.')
    }
  }

  // Permanent deletion is only ever available from within the Archive.
  const handleDeleteForever = async (id) => {
    try {
      await deleteApplication(id)
      setAllApplications((list) => list.filter((app) => app.id !== id))
    } catch (err) {
      console.error(err)
      setApplicationsError(err.message || 'Could not delete this application.')
    }
  }

  return (
    <div className="app-shell">
      <PatientSidebar
        photo={photo}
        hospitalNumber={hospitalNumber}
        onRegenerate={() =>
          setHospitalNumber(generateNextHospitalNumber(existingHospitalNumbers(allApplications)))
        }
        name={fullName}
        status={dispositionCategory}
        view={view}
        onNavigateSection={goToSection}
        onOpenArchive={openArchive}
        archiveCount={archivedApplications.length}
      />

      <main className="app-main">
        {view === 'archive' ? (
          <>
            <header className="letterhead letterhead-archive">
              <div className="letterhead-mark" aria-hidden="true">
                <img src={hospitalLogo} alt="" className="letterhead-logo" />
              </div>
              <div>
                <h1>Archive</h1>
                <p>Applications removed from the active list are kept here.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={backToForm}>
                ← Back to Form
              </button>
            </header>

            <FormSection
              id="archive"
              eyebrow="Archive"
              title="Archived Applications"
              description="Restore an application to bring it back to the active Applications list, or delete it forever."
            >
              <ArchivePanel
                applications={archivedApplications}
                onPreview={(app) => setPdfPreviewData(app)}
                onRestore={handleRestoreApplication}
                onDeleteForever={handleDeleteForever}
              />
            </FormSection>
          </>
        ) : (
          <>
        <header className="letterhead">
          <div className="letterhead-mark" aria-hidden="true">
            <img src={hospitalLogo} alt="" className="letterhead-logo" />
          </div>
          <div>
            <h1>E. Zarate Hospital</h1>
            <p>Pre-Employment Medical Examination Report</p>
          </div>
          <div className="letterhead-meta">
            <span>Hospital No.</span>
            <strong>{hospitalNumber}</strong>
          </div>
        </header>

        {editingId && (
          <div className="submit-banner submit-banner-editing">
            Editing application &mdash; Hospital No. <strong>{hospitalNumber}</strong>. Saving will
            update this record instead of creating a new one.
            <button type="button" className="btn btn-text btn-sm" onClick={handleCancelEdit}>
              Cancel Edit
            </button>
          </div>
        )}

        {saveNotice && (
          <div className="submit-banner">
            {saveNotice.mode === 'updated'
              ? 'Application updated. Hospital No. '
              : 'Report saved to Applications. Hospital No. '}
            <strong>{saveNotice.hospitalNumber}</strong> — disposition:{' '}
            <strong>{saveNotice.dispositionCategory.replace(/_/g, ' ').toUpperCase()}</strong>
          </div>
        )}

        {applicationsError && (
          <div className="submit-banner submit-banner-editing">
            {applicationsError}
          </div>
        )}

        {applicationsLoading && (
          <div className="submit-banner">Loading saved applications from Supabase…</div>
        )}

        <form onSubmit={handleSubmit}>
          <FormSection
            id="personal"
            eyebrow="01"
            title="Applicant Photo & Personal Information"
            description="Capture a 2x2 photo and complete the applicant's basic details."
          >
            <div className="personal-grid">
              <PhotoCapture photo={photo} onChange={setPhoto} />

              <div className="field-grid">
                <label className="field">
                  <span>Surname</span>
                  <input
                    value={personal.surname}
                    onChange={(e) => updatePersonal('surname', e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Given Name</span>
                  <input
                    value={personal.given}
                    onChange={(e) => updatePersonal('given', e.target.value)}
                    required
                  />
                </label>
                <label className="field field-sm">
                  <span>M.I.</span>
                  <input
                    value={personal.mi}
                    maxLength={2}
                    onChange={(e) => updatePersonal('mi', e.target.value)}
                  />
                </label>

                <label className="field field-wide">
                  <span>Complete Address</span>
                  <input
                    value={personal.address}
                    onChange={(e) => updatePersonal('address', e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Gender</span>
                  <select
                    value={personal.gender}
                    onChange={(e) => updatePersonal('gender', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </label>
                <label className="field field-sm">
                  <span>Age</span>
                  <input
                    type="number"
                    min="0"
                    value={personal.age}
                    onChange={(e) => updatePersonal('age', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Civil Status</span>
                  <select
                    value={personal.civilStatus}
                    onChange={(e) => updatePersonal('civilStatus', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Widowed</option>
                    <option>Separated</option>
                  </select>
                </label>

                <label className="field">
                  <span>Date of Birth</span>
                  <input
                    type="date"
                    value={personal.dob}
                    onChange={(e) => updatePersonal('dob', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Occupation / Position</span>
                  <input
                    value={personal.occupation}
                    onChange={(e) => updatePersonal('occupation', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Date of Examination</span>
                  <input
                    type="date"
                    value={personal.examDate}
                    onChange={(e) => updatePersonal('examDate', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection
            id="history"
            eyebrow="02"
            title="Medical History"
            description="Has the applicant been told to have any of the following conditions?"
          >
            <div className="history-grid">
              {medicalHistoryColumns.map((col) => (
                <div className="history-column" key={col.heading}>
                  <h3>{col.heading}</h3>
                  {col.items.map((item) => (
                    <YesNoRow
                      key={item.id}
                      item={item}
                      value={medicalHistory[item.id]}
                      onChange={updateHistory}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="history-grid history-grid-social">
              {personalSocialHistoryColumns.map((col) => (
                <div className="history-column" key={col.heading}>
                  <h3>{col.heading}</h3>
                  {col.items.map((item) => (
                    <YesNoRow
                      key={item.id}
                      item={item}
                      value={medicalHistory[item.id]}
                      onChange={updateHistory}
                    />
                  ))}
                </div>
              ))}
            </div>

            {personal.gender === 'female' && (
              <div className="field-grid female-history">
                <label className="field">
                  <span>Obstetrical Score (G P)</span>
                  <input
                    value={femaleHistory.obstetricalScore}
                    onChange={(e) =>
                      setFemaleHistory((f) => ({ ...f, obstetricalScore: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Last Menstrual Period</span>
                  <input
                    type="date"
                    value={femaleHistory.lmp}
                    onChange={(e) => setFemaleHistory((f) => ({ ...f, lmp: e.target.value }))}
                  />
                </label>
              </div>
            )}

            <label className="field field-wide">
              <span>Other Significant Info Regarding History</span>
              <textarea
                rows={2}
                value={otherHistoryNotes}
                onChange={(e) => setOtherHistoryNotes(e.target.value)}
              />
            </label>
          </FormSection>

          <FormSection
            id="exam"
            eyebrow="03"
            title="Physical Examination Findings"
            description="Vital signs, sensory screening, and system-by-system findings."
          >
            <div className="vitals-grid">
              <label className="field">
                <span>Blood Pressure (mmHg)</span>
                <input value={vitals.bp} onChange={(e) => updateVitals('bp', e.target.value)} placeholder="120/80" />
              </label>
              <label className="field">
                <span>Pulse (/min)</span>
                <input value={vitals.pulse} onChange={(e) => updateVitals('pulse', e.target.value)} />
              </label>
              <label className="field">
                <span>Respiratory Rate (/min)</span>
                <input value={vitals.respRate} onChange={(e) => updateVitals('respRate', e.target.value)} />
              </label>
              <label className="field">
                <span>Temperature (°C)</span>
                <input value={vitals.temp} onChange={(e) => updateVitals('temp', e.target.value)} />
              </label>
              <label className="field">
                <span>Height (cm)</span>
                <input value={vitals.height} onChange={(e) => updateVitals('height', e.target.value)} />
              </label>
              <label className="field">
                <span>Weight (kg)</span>
                <input value={vitals.weight} onChange={(e) => updateVitals('weight', e.target.value)} />
              </label>
              <label className="field">
                <span>Build</span>
                <input value={vitals.build} onChange={(e) => updateVitals('build', e.target.value)} />
              </label>
            </div>

            <div className="sensory-grid">
              <div className="sensory-card sensory-card-full">
                <h4>Visual Acuity</h4>
                <div className="acuity-split">
                  <div className="acuity-block">
                    <p className="sensory-sublabel sensory-sublabel-first">Far Sighted</p>
                    <OptionPills
                      name="visualAcuityFarMode"
                      ariaLabel="Far Sighted — Uncorrected or Corrected"
                      value={vitals.visualAcuityFarMode}
                      onChange={(v) => updateVitals('visualAcuityFarMode', v)}
                      options={[
                        { value: 'uncorrected', label: 'Uncorrected' },
                        { value: 'corrected', label: 'Corrected' },
                      ]}
                    />
                    <div className="sensory-row sensory-row-score">
                      <span>Score</span>
                      <input
                        placeholder="OD"
                        value={vitals.visualAcuityFarOD}
                        onChange={(e) => updateVitals('visualAcuityFarOD', e.target.value)}
                      />
                      <input
                        placeholder="OS"
                        value={vitals.visualAcuityFarOS}
                        onChange={(e) => updateVitals('visualAcuityFarOS', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="acuity-block">
                    <p className="sensory-sublabel sensory-sublabel-first">Near Sighted</p>
                    <OptionPills
                      name="visualAcuityNearMode"
                      ariaLabel="Near Sighted — Uncorrected or Corrected"
                      value={vitals.visualAcuityNearMode}
                      onChange={(v) => updateVitals('visualAcuityNearMode', v)}
                      options={[
                        { value: 'uncorrected', label: 'Uncorrected' },
                        { value: 'corrected', label: 'Corrected' },
                      ]}
                    />
                    <div className="sensory-row sensory-row-score">
                      <span>Score</span>
                      <input
                        placeholder="OD"
                        value={vitals.visualAcuityNearOD}
                        onChange={(e) => updateVitals('visualAcuityNearOD', e.target.value)}
                      />
                      <input
                        placeholder="OS"
                        value={vitals.visualAcuityNearOS}
                        onChange={(e) => updateVitals('visualAcuityNearOS', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sensory-card">
                <h4>Color Vision</h4>
                <select
                  value={vitals.colorVision}
                  onChange={(e) => updateVitals('colorVision', e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="defective">Defective</option>
                </select>
                <div className="sensory-row sensory-row-score">
                  <span>Score</span>
                  <input
                    placeholder="e.g. 14/14 plates"
                    value={vitals.colorVisionScore}
                    onChange={(e) => updateVitals('colorVisionScore', e.target.value)}
                  />
                </div>
              </div>

              <div className="sensory-card">
                <h4>Hearing</h4>
                <div className="sensory-row">
                  <span>AD (right)</span>
                  <select
                    value={vitals.hearingAD}
                    onChange={(e) => updateVitals('hearingAD', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="defective">Defective</option>
                  </select>
                  <input
                    placeholder="Score"
                    value={vitals.hearingADScore}
                    onChange={(e) => updateVitals('hearingADScore', e.target.value)}
                  />
                </div>
                <div className="sensory-row">
                  <span>AS (left)</span>
                  <select
                    value={vitals.hearingAS}
                    onChange={(e) => updateVitals('hearingAS', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="defective">Defective</option>
                  </select>
                  <input
                    placeholder="Score"
                    value={vitals.hearingASScore}
                    onChange={(e) => updateVitals('hearingASScore', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="findings-grid">
              {physicalExamColumns.map((col) => (
                <div className="findings-column" key={col.heading}>
                  <h3>{col.heading}</h3>
                  {col.items.map((item) => (
                    <FindingRow
                      key={item.id}
                      item={item}
                      value={physicalExam[item.id]}
                      onChange={updateFinding}
                    />
                  ))}
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection
            id="labs"
            eyebrow="04"
            title="X-Ray, ECG & Laboratory Examinations"
          >
            <div className="findings-grid findings-grid-single">
              <div className="findings-column">
                {xrayLabItems
                  .filter((item) => item.id !== 'lab_others')
                  .map((item) => (
                    <FindingRow
                      key={item.id}
                      item={item}
                      value={labResults[item.id]}
                      onChange={updateLabFinding}
                      notePlaceholder="Describe X-ray / lab findings"
                    />
                  ))}
              </div>
            </div>

            <label className="field field-wide lab-others-field">
              <span>Others (comment / description)</span>
              <textarea
                rows={2}
                placeholder="e.g. Additional test name and result"
                value={labResults.lab_others?.note || ''}
                onChange={(e) => updateLabFinding('lab_others', { note: e.target.value })}
              />
            </label>

            <div className="lab-table">
              <div className="lab-table-head">
                <span>Screening Test</span>
                <span>Result</span>
              </div>
              {screeningTests.map((item) => (
                <div className="lab-table-row" key={item.id}>
                  <span>{item.label}</span>
                  <div className="check-row-options">
                    <label className={`pill pill-no ${screeningResults[item.id] === 'negative' ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name={item.id}
                        checked={screeningResults[item.id] === 'negative'}
                        onChange={() =>
                          updateLab(screeningResults, setScreeningResults, item.id, 'negative')
                        }
                      />
                      Negative
                    </label>
                    <label className={`pill pill-yes ${screeningResults[item.id] === 'positive' ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name={item.id}
                        checked={screeningResults[item.id] === 'positive'}
                        onChange={() =>
                          updateLab(screeningResults, setScreeningResults, item.id, 'positive')
                        }
                      />
                      Positive
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection id="diagnosis" eyebrow="05" title="Diagnosis / Remarks">
            <label className="field field-wide">
              <span>Diagnosis</span>
              <textarea rows={3} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
            </label>
          </FormSection>

          <FormSection
            id="disposition"
            eyebrow="06"
            title="Disposition"
            description="Select the applicant's employment fitness classification."
          >
            <DispositionSelector
              selected={dispositionCategory}
              note={dispositionNote}
              onSelect={setDispositionCategory}
              onNoteChange={setDispositionNote}
            />

            <label className="field field-wide disposition-other">
              <span>Other Disease / Findings</span>
              <textarea
                rows={2}
                placeholder="Note any other disease or finding not captured above..."
                value={otherDiseaseFindings}
                onChange={(e) => setOtherDiseaseFindings(e.target.value)}
              />
            </label>
          </FormSection>

          <FormSection
            id="applications"
            eyebrow="07"
            title="Applications"
            description="Every saved report is stored in Supabase, so it's available from any browser or device."
          >
            <div className="applications-toolbar">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPdfPreviewData(buildSnapshot())}
              >
                Preview Current Form as PDF
              </button>
            </div>
            <ApplicationsPanel
              applications={applications}
              onPreview={(app) => setPdfPreviewData(app)}
              onEdit={handleEditApplication}
              onArchive={handleArchiveApplication}
            />
          </FormSection>

          <FormSection id="signoff" eyebrow="08" title="Examiner & Sign-off">
            <div className="field-grid">
              <label className="field">
                <span>Examining Physician</span>
                <input
                  value={examiner.name}
                  onChange={(e) => setExaminer((ex) => ({ ...ex, name: e.target.value }))}
                  placeholder="Dr. Edgar L. Zarate"
                />
              </label>
              <label className="field">
                <span>Medical Examiner Reg. No.</span>
                <input
                  value={examiner.licenseNo}
                  onChange={(e) => setExaminer((ex) => ({ ...ex, licenseNo: e.target.value }))}
                  placeholder="Reg. No. 5062391"
                />
              </label>
            </div>

            <div className="signature-grid">
              <SignaturePad
                label="Applicant's Signature"
                value={applicantSignature}
                onChange={setApplicantSignature}
              />
              <SignaturePad
                label="Examiner's Signature"
                value={examinerSignature}
                onChange={setExaminerSignature}
              />
            </div>
          </FormSection>

          <div className="submit-row">
            <p>Valid for six (6) months only from date of examination.</p>
            <div className="submit-row-actions">
              {editingId && (
                <button type="button" className="btn btn-ghost btn-lg" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-lg" disabled={isSaving}>
                {isSaving
                  ? 'Saving…'
                  : editingId
                    ? 'Update Examination Report'
                    : 'Save Examination Report'}
              </button>
            </div>
          </div>
        </form>
          </>
        )}
      </main>

      {pdfPreviewData && (
        <PdfPreviewModal
          data={pdfPreviewData}
          fileName={`${pdfPreviewData.hospitalNumber || 'application'}.pdf`}
          onClose={() => setPdfPreviewData(null)}
        />
      )}

      <button
        type="button"
        className={`back-to-top${showBackToTop ? ' is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M12 5l-7 7h4v7h6v-7h4z" />
        </svg>
      </button>
    </div>
  )
}

export default App