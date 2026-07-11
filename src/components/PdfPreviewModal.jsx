import { useEffect, useRef, useState } from 'react'
import { buildPdfFromData, pdfToBlobUrl } from '../utils/generatePdf.js'

export default function PdfPreviewModal({ data, fileName, onClose }) {
  const pdfRef = useRef(null)
  const [status, setStatus] = useState('generating') // generating | ready | error
  const [blobUrl, setBlobUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    let localUrl = null

    async function run() {
      setStatus('generating')
      try {
        const pdf = await buildPdfFromData(data)
        if (cancelled) return
        pdfRef.current = pdf
        localUrl = await pdfToBlobUrl(pdf)
        if (cancelled) {
          URL.revokeObjectURL(localUrl)
          return
        }
        setBlobUrl(localUrl)
        setStatus('ready')
      } catch (err) {
        console.error('PDF generation failed:', err)
        if (!cancelled) setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [data])

  const handleDownload = () => {
    if (pdfRef.current) {
      pdfRef.current.save(fileName || 'pre-employment-application.pdf')
    }
  }

  return (
    <div className="pdf-modal-backdrop" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pdf-modal-head">
          <h3>Application PDF Preview</h3>
          <div className="pdf-modal-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDownload}
              disabled={status !== 'ready'}
            >
              Download PDF
            </button>
            <button type="button" className="btn btn-text btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <div className="pdf-modal-body">
          {status === 'generating' && <p className="pdf-modal-status">Generating PDF preview…</p>}
          {status === 'error' && (
            <p className="pdf-modal-status pdf-modal-error">
              Couldn&rsquo;t generate the PDF preview. You can still try downloading again.
            </p>
          )}
          {status === 'ready' && blobUrl && (
            <iframe title="Application PDF preview" src={blobUrl} className="pdf-modal-frame" />
          )}
        </div>
      </div>
    </div>
  )
}
