import { useEffect, useRef, useState } from 'react'
import { buildPdfFromData, pdfToBlobUrl, pdfToPageImage, isHandheldMobile } from '../utils/generatePdf.js'

export default function PdfPreviewModal({ data, fileName, onClose }) {
  const pdfRef = useRef(null)
  const [status, setStatus] = useState('generating') // generating | ready | preview_error | error
  const [blobUrl, setBlobUrl] = useState(null)
  const [pageImage, setPageImage] = useState(null)
  const [errorDetail, setErrorDetail] = useState('')
  const [canDownload, setCanDownload] = useState(false)
  const mobile = isHandheldMobile()

  useEffect(() => {
    let cancelled = false
    let localUrl = null

    async function run() {
      setStatus('generating')
      setCanDownload(false)

      // Step 1: build the PDF itself. If this fails, nothing else can work.
      let pdf
      try {
        pdf = await buildPdfFromData(data)
        if (cancelled) return
        pdfRef.current = pdf
        setCanDownload(true) // the PDF exists now — download should work even if preview rendering fails below
      } catch (err) {
        console.error('PDF build failed:', err)
        if (!cancelled) {
          setErrorDetail(err?.message || String(err))
          setStatus('error')
        }
        return
      }

      // Step 2: build the on-screen preview. This can fail independently
      // (e.g. mobile rasterization issues) without affecting the download.
      try {
        if (mobile) {
          const img = await pdfToPageImage(pdf, 2)
          if (cancelled) return
          setPageImage(img)
        } else {
          localUrl = await pdfToBlobUrl(pdf)
          if (cancelled) {
            URL.revokeObjectURL(localUrl)
            return
          }
          setBlobUrl(localUrl)
        }
        setStatus('ready')
      } catch (err) {
        console.error('PDF preview rendering failed:', err)
        if (!cancelled) {
          setErrorDetail(err?.message || String(err))
          setStatus('preview_error')
        }
      }
    }

    run()
    return () => {
      cancelled = true
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [data, mobile])

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
              disabled={!canDownload}
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
              Couldn&rsquo;t generate the PDF. {errorDetail ? `(${errorDetail})` : ''}
            </p>
          )}
          {status === 'preview_error' && (
            <p className="pdf-modal-status pdf-modal-error">
              Built the PDF, but couldn&rsquo;t render the on-screen preview. You can still download it below.
              {errorDetail ? ` (${errorDetail})` : ''}
            </p>
          )}
          {status === 'ready' && mobile && pageImage && (
            <div className="pdf-modal-scroll">
              <img
                src={pageImage.dataUrl}
                alt="Application PDF preview"
                className="pdf-modal-image"
              />
            </div>
          )}
          {status === 'ready' && !mobile && blobUrl && (
            <iframe title="Application PDF preview" src={blobUrl} className="pdf-modal-frame" />
          )}
        </div>
      </div>
    </div>
  )
}
