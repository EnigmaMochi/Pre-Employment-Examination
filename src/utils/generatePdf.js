import { jsPDF } from 'jspdf'
import {
  medicalHistoryColumns,
  personalSocialHistoryColumns,
  physicalExamColumns,
  xrayLabItems,
  screeningTests,
  dispositionCategories,
} from '../data/checklist.js'

// Builds the Pre-Employment Medical Examination Report as a single-page,
// native vector PDF (real text + thin drawn rules, no rasterized
// screenshot). Everything from the hospital's paper form — letterhead,
// applicant info, Sections I/II/III, diagnosis, disposition and
// signatures — is laid out on one A4 page using a lightweight, hand-rolled
// grid renderer (no jspdf-autotable dependency, which both shrinks the
// bundle and keeps row heights fully predictable so the page never spills
// over). File size stays small because almost everything is text; the
// only raster data is the applicant photo and the two signatures, each
// downscaled/recompressed before being embedded.

const INK = [23, 42, 40]
const MUTED = [110, 122, 122]
const LINE = [222, 228, 227]
const HEAD_BG = [242, 246, 245]
const BAD = [178, 48, 48]

const PAGE_MARGIN = 30

function fmtYesNo(v) {
  if (v === 'yes') return 'Yes'
  if (v === 'no') return 'No'
  return '\u2014'
}

function fmtStatus(status, note) {
  if (status === 'abnormal') return note ? `Abnormal \u2013 ${note}` : 'Abnormal'
  if (status === 'not_done') return 'Not Done'
  if (status === 'normal') return 'Normal'
  return '\u2014'
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = dataUrl
  })
}

// Downscales + recompresses any incoming image (phone photo, camera
// capture, signature-pad export) so embedding it can never blow up the
// PDF's file size, regardless of what the source device produced.
async function compressImage(dataUrl, maxDim, quality, mime) {
  if (!dataUrl) return null
  try {
    const img = await loadImage(dataUrl)
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
    return { dataUrl: canvas.toDataURL(mime, quality), width: w, height: h }
  } catch {
    return null
  }
}

// Groups a flat item list into rows of `pairsPerRow` [label, value] pairs
// so a long checklist reads as N side-by-side columns, like the paper form.
function buildPairedRows(items, getValue, pairsPerRow) {
  const rows = []
  for (let i = 0; i < items.length; i += pairsPerRow) {
    const row = []
    for (let p = 0; p < pairsPerRow; p += 1) {
      const it = items[i + p]
      row.push(it ? it.label : '')
      row.push(it ? getValue(it) : '')
    }
    rows.push(row)
  }
  return rows
}

// Truncates text with an ellipsis so it never overflows a fixed-width,
// fixed-height cell (keeps every row height perfectly predictable).
function fitText(doc, text, maxWidth) {
  const str = String(text ?? '')
  if (doc.getTextWidth(str) <= maxWidth) return str
  let t = str
  while (t.length > 1 && doc.getTextWidth(`${t}\u2026`) > maxWidth) {
    t = t.slice(0, -1)
  }
  return `${t}\u2026`
}

// Wraps text to at most `maxLines`, ellipsizing the final line if the
// content is longer than that — guarantees a fixed vertical footprint
// even for open-ended free-text fields.
function wrapCapped(doc, text, maxWidth, maxLines) {
  const lines = doc.splitTextToSize(String(text || ''), maxWidth)
  if (lines.length <= maxLines) return lines
  const capped = lines.slice(0, maxLines)
  let last = capped[maxLines - 1]
  while (last.length > 1 && doc.getTextWidth(`${last}\u2026`) > maxWidth) {
    last = last.slice(0, -1)
  }
  capped[maxLines - 1] = `${last}\u2026`
  return capped
}

// Minimal, fixed-row-height grid renderer (a lightweight stand-in for
// autoTable) — draws a header band, body rows, and rule lines.
function drawGrid(doc, { x, y, colWidths, header, rows, rowH, headerH, fontSize, headerFontSize, boldCols = [], cellColor }) {
  const totalW = colWidths.reduce((a, b) => a + b, 0)
  let cy = y

  if (header) {
    doc.setFillColor(...HEAD_BG)
    doc.rect(x, cy, totalW, headerH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(headerFontSize)
    doc.setTextColor(...INK)
    let cx = x
    header.forEach((h, i) => {
      doc.text(fitText(doc, h, colWidths[i] - 8), cx + 4, cy + headerH / 2 + headerFontSize * 0.32)
      cx += colWidths[i]
    })
    cy += headerH
  }

  doc.setFontSize(fontSize)
  rows.forEach((row) => {
    let cx = x
    row.forEach((val, i) => {
      const bold = boldCols.includes(i)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const color = (cellColor && cellColor(i, val)) || INK
      doc.setTextColor(...color)
      doc.text(fitText(doc, val, colWidths[i] - 8), cx + 4, cy + rowH / 2 + fontSize * 0.32)
      cx += colWidths[i]
    })
    cy += rowH
  })

  const bottom = cy
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.5)
  doc.rect(x, y, totalW, bottom - y)
  let hy = y + (header ? headerH : 0)
  for (let i = 0; i <= rows.length; i += 1) {
    doc.line(x, hy, x + totalW, hy)
    hy += rowH
  }
  let vx = x
  colWidths.forEach((w) => {
    doc.line(vx, y, vx, bottom)
    vx += w
  })
  doc.line(x + totalW, y, x + totalW, bottom)

  return bottom
}

function drawSectionTitle(doc, title, x, width, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(title, x, y)
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.8)
  doc.line(x, y + 3, x + width, y + 3)
  return y + 13
}

function colorYesNo(i, val) {
  if ((i === 1 || i === 3 || i === 5) && val === 'Yes') return BAD
  return null
}

function colorFinding(i, val) {
  if ((i === 1 || i === 3) && typeof val === 'string' && val.startsWith('Abnormal')) return BAD
  return null
}

export async function buildPdfFromData(data) {
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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const rightEdge = pageWidth - PAGE_MARGIN

  // ---------- Letterhead ----------
  let y = PAGE_MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text('E. ZARATE HOSPITAL', PAGE_MARGIN, y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(...MUTED)
  doc.text('36 J. Aguirre Avenue, Talon I, Las Pi\u00f1as City, Metro Manila, Philippines', PAGE_MARGIN, y + 21)
  doc.text('Tel: (02) 871-3440 / (02) 873-5598 / (02) 874-6005', PAGE_MARGIN, y + 30)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text('MEDICAL EXAMINATION REPORT', rightEdge, y + 11, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text(`Hospital No. ${hospitalNumber || '\u2014'}`, rightEdge, y + 21, { align: 'right' })

  y += 33
  doc.setDrawColor(...INK)
  doc.setLineWidth(1.1)
  doc.line(PAGE_MARGIN, y, rightEdge, y)
  y += 10

  // ---------- Applicant info + photo ----------
  const photoSize = 46
  const photoInfo = photo ? await compressImage(photo, 260, 0.72, 'image/jpeg') : null
  const infoWidth = photoInfo ? contentWidth - photoSize - 10 : contentWidth

  const infoRows = [
    ['Name', fullName || '\u2014', 'Age / Gender', `${personal.age || '\u2014'} / ${personal.gender || '\u2014'}`],
    ['Address', personal.address || '\u2014', '', ''],
    ['Civil Status', personal.civilStatus || '\u2014', 'Date of Birth', personal.dob || '\u2014'],
    ['Occupation / Position', personal.occupation || '\u2014', 'Exam Date', personal.examDate || '\u2014'],
  ]
  const infoRowH = 13
  const labelW = infoWidth * 0.24
  const valueW = infoWidth * 0.34
  const label2W = infoWidth * 0.17
  const value2W = infoWidth - labelW - valueW - label2W

  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.5)
  doc.rect(PAGE_MARGIN, y, infoWidth, infoRowH * infoRows.length)
  let iy = y
  infoRows.forEach((row) => {
    doc.line(PAGE_MARGIN, iy, PAGE_MARGIN + infoWidth, iy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    doc.text(row[0].toUpperCase(), PAGE_MARGIN + 5, iy + infoRowH / 2 + 2.2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.6)
    doc.setTextColor(...INK)
    const spanned = row[2] === ''
    const valueSpanW = spanned ? infoWidth - labelW - 8 : valueW - 8
    doc.text(fitText(doc, row[1], valueSpanW), PAGE_MARGIN + labelW + 5, iy + infoRowH / 2 + 2.2)
    if (!spanned) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.8)
      doc.setTextColor(...MUTED)
      doc.text(row[2].toUpperCase(), PAGE_MARGIN + labelW + valueW + 5, iy + infoRowH / 2 + 2.2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.6)
      doc.setTextColor(...INK)
      doc.text(fitText(doc, row[3], value2W - 8), PAGE_MARGIN + labelW + valueW + label2W + 5, iy + infoRowH / 2 + 2.2)
    }
    iy += infoRowH
  })

  if (photoInfo) {
    const px = rightEdge - photoSize
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.6)
    doc.rect(px, y, photoSize, photoSize)
    doc.addImage(photoInfo.dataUrl, 'JPEG', px, y, photoSize, photoSize)
  }

  y += infoRowH * infoRows.length + 10

  // ---------- Section I: Medical & Personal/Social History ----------
  y = drawSectionTitle(doc, 'I. MEDICAL & PERSONAL / SOCIAL HISTORY', PAGE_MARGIN, contentWidth, y)

  const allHistoryItems = [
    ...medicalHistoryColumns.flatMap((c) => c.items),
    ...personalSocialHistoryColumns.flatMap((c) => c.items),
  ]
  const histPairs = 3
  const histPairW = contentWidth / histPairs
  const histLabelW = histPairW * 0.72
  const histValueW = histPairW - histLabelW
  const histColWidths = [histLabelW, histValueW, histLabelW, histValueW, histLabelW, histValueW]

  y = drawGrid(doc, {
    x: PAGE_MARGIN,
    y,
    colWidths: histColWidths,
    header: ['Condition', 'Y/N', 'Condition', 'Y/N', 'Condition', 'Y/N'],
    rows: buildPairedRows(allHistoryItems, (it) => fmtYesNo(medicalHistory[it.id]), histPairs),
    rowH: 10.2,
    headerH: 11.5,
    fontSize: 6.7,
    headerFontSize: 7.1,
    cellColor: colorYesNo,
  })
  y += 6

  if (personal.gender === 'female') {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    doc.setTextColor(...INK)
    doc.text(
      `Obstetrical Score: ${femaleHistory.obstetricalScore || '\u2014'}     Last Menstrual Period: ${femaleHistory.lmp || '\u2014'}`,
      PAGE_MARGIN,
      y,
    )
    y += 10
  }

  if (otherHistoryNotes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...INK)
    const lines = wrapCapped(doc, `Other history notes: ${otherHistoryNotes}`, contentWidth, 1)
    doc.text(lines, PAGE_MARGIN, y)
    y += 9
  }

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.1)
  doc.setTextColor(...MUTED)
  const consentLines = wrapCapped(
    doc,
    'I hereby permit the undersigned Physician to disclose my Health Status and release them from liability arising from such disclosure. I certify that my Medical History above is true, correct and complete.',
    contentWidth,
    2,
  )
  doc.text(consentLines, PAGE_MARGIN, y)
  y += consentLines.length * 7 + 8

  // ---------- Section II: Physical Examination Findings ----------
  y = drawSectionTitle(doc, 'II. PHYSICAL EXAMINATION FINDINGS', PAGE_MARGIN, contentWidth, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.3)
  doc.setTextColor(...INK)
  doc.text(
    `BP: ${vitals.bp || '\u2014'}   Pulse: ${vitals.pulse || '\u2014'}   RR: ${vitals.respRate || '\u2014'}   Temp: ${vitals.temp || '\u2014'}   Ht: ${vitals.height || '\u2014'}   Wt: ${vitals.weight || '\u2014'}   Build: ${vitals.build || '\u2014'}`,
    PAGE_MARGIN,
    y,
  )
  y += 11

  const vaFarMode = vitals.visualAcuityFarMode === 'corrected' ? 'Corrected' : 'Uncorrected'
  const vaNearMode = vitals.visualAcuityNearMode === 'corrected' ? 'Corrected' : 'Uncorrected'
  doc.text(
    `Visual Acuity — Far Sighted (${vaFarMode}) OD: ${vitals.visualAcuityFarOD || '\u2014'}  OS: ${vitals.visualAcuityFarOS || '\u2014'}   |   Near Sighted (${vaNearMode}) OD: ${vitals.visualAcuityNearOD || '\u2014'}  OS: ${vitals.visualAcuityNearOS || '\u2014'}`,
    PAGE_MARGIN,
    y,
  )
  y += 9
  doc.text(
    `Color Vision: ${vitals.colorVision || '\u2014'}   |   Hearing AD: ${vitals.hearingAD || '\u2014'}  AS: ${vitals.hearingAS || '\u2014'}`,
    PAGE_MARGIN,
    y,
  )
  y += 10

  const peItems = physicalExamColumns.flatMap((c) => c.items)
  const pePairs = 2
  const pePairW = contentWidth / pePairs
  const peLabelW = pePairW * 0.42
  const peValueW = pePairW - peLabelW

  y = drawGrid(doc, {
    x: PAGE_MARGIN,
    y,
    colWidths: [peLabelW, peValueW, peLabelW, peValueW],
    header: ['Body System', 'Findings', 'Body System', 'Findings'],
    rows: buildPairedRows(peItems, (it) => {
      const v = physicalExam[it.id] || {}
      return fmtStatus(v.status, v.note)
    }, pePairs),
    rowH: 11,
    headerH: 12,
    fontSize: 6.8,
    headerFontSize: 7.1,
    cellColor: colorFinding,
  })
  y += 10

  // ---------- Section III: X-Ray, ECG & Laboratory Examinations ----------
  y = drawSectionTitle(doc, 'III. X-RAY, ECG, LABORATORY & SCREENING', PAGE_MARGIN, contentWidth, y)

  const standardLabItems = xrayLabItems.filter((it) => it.id !== 'lab_others')
  const othersNote = (labResults.lab_others && labResults.lab_others.note) || ''
  const combinedTests = [
    ...standardLabItems.map((it) => ({ label: it.label, value: fmtStatus((labResults[it.id] || {}).status, (labResults[it.id] || {}).note) })),
    { label: 'Others', value: othersNote || '\u2014' },
    ...screeningTests.map((it) => ({ label: it.label, value: (screeningResults[it.id] || '\u2014').toString().toUpperCase() })),
  ]
  const labPairs = 2
  const labPairW = contentWidth / labPairs
  const labLabelW = labPairW * 0.48
  const labValueW = labPairW - labLabelW

  y = drawGrid(doc, {
    x: PAGE_MARGIN,
    y,
    colWidths: [labLabelW, labValueW, labLabelW, labValueW],
    header: ['Examination', 'Result', 'Examination', 'Result'],
    rows: buildPairedRows(combinedTests, (it) => it.value, labPairs),
    rowH: 11,
    headerH: 12,
    fontSize: 6.8,
    headerFontSize: 7.1,
    cellColor: (i, val) => ((i === 1 || i === 3) && typeof val === 'string' && val.startsWith('Abnormal') ? BAD : null),
  })
  y += 12

  // ---------- Diagnosis ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.2)
  doc.setTextColor(...INK)
  doc.text('DIAGNOSIS:', PAGE_MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  const diagLines = wrapCapped(doc, diagnosis || '\u2014', contentWidth - 62, 2)
  doc.text(diagLines, PAGE_MARGIN + 62, y)
  y += Math.max(diagLines.length, 1) * 9.5 + 8

  // ---------- Disposition ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.2)
  doc.setTextColor(...INK)
  doc.text('DISPOSITION:', PAGE_MARGIN, y)
  const activeDisposition = dispositionCategories.find((c) => c.id === dispositionCategory)
  doc.setFontSize(7.8)
  doc.text(fitText(doc, activeDisposition ? activeDisposition.label : '\u2014', contentWidth - 70), PAGE_MARGIN + 70, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  if (dispositionNote) {
    const lines = wrapCapped(doc, `Note: ${dispositionNote}`, contentWidth, 1)
    doc.text(lines, PAGE_MARGIN, y)
    y += 9
  }
  if (otherDiseaseFindings) {
    const lines = wrapCapped(doc, `Other Disease / Findings: ${otherDiseaseFindings}`, contentWidth, 1)
    doc.text(lines, PAGE_MARGIN, y)
    y += 9
  }
  y += 6

  // ---------- Examiner ----------
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.6)
  doc.setTextColor(...INK)
  doc.text(
    `Examining Physician: ${examiner.name || '\u2014'}     Medical Examiner Reg. No.: ${examiner.licenseNo || '\u2014'}`,
    PAGE_MARGIN,
    y,
  )
  y += 26

  // ---------- Signatures ----------
  const sigW = 165
  const sigH = 32
  const leftX = PAGE_MARGIN
  const rightX = rightEdge - sigW

  if (applicantSignature) {
    const sig = await compressImage(applicantSignature, 320, 0.85, 'image/png')
    if (sig) doc.addImage(sig.dataUrl, 'PNG', leftX, y - sigH, sigW, sigH)
  }
  if (examinerSignature) {
    const sig = await compressImage(examinerSignature, 320, 0.85, 'image/png')
    if (sig) doc.addImage(sig.dataUrl, 'PNG', rightX, y - sigH, sigW, sigH)
  }

  doc.setDrawColor(...INK)
  doc.setLineWidth(0.7)
  doc.line(leftX, y, leftX + sigW, y)
  doc.line(rightX, y, rightX + sigW, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text('Applicant\u2019s Signature', leftX + sigW / 2, y + 10, { align: 'center' })
  doc.text('Examiner\u2019s Signature', rightX + sigW / 2, y + 10, { align: 'center' })

  y += 22
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6)
  doc.setTextColor(...MUTED)
  doc.text(
    wrapCapped(
      doc,
      'This certificate is for the purpose of a routine, employment-based medical exam only. Valid for six (6) months and limited to the item/s above indicated. Other diseases/conditions not covered by these examinations are not disclosed, unless further evaluation is conducted at the Physician\u2019s discretion, with the examinee\u2019s consent.',
      contentWidth,
      3,
    ),
    PAGE_MARGIN,
    y,
  )

  return doc
}

export async function pdfToBlobUrl(pdf) {
  const blob = pdf.output('blob')
  return URL.createObjectURL(blob)
}
