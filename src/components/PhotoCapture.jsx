import { useCallback, useEffect, useRef, useState } from 'react'

export default function PhotoCapture({ photo, onChange }) {
  const [mode, setMode] = useState('idle') // idle | camera
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => stopStream, [stopStream])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      setMode('camera')
      // Wait a tick for the <video> element to mount.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
    } catch {
      setError('Camera unavailable. Please check permissions or upload a photo instead.')
    }
  }

  const cancelCamera = () => {
    stopStream()
    setMode('idle')
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = 480
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480)
    onChange(canvas.toDataURL('image/jpeg', 0.9))
    stopStream()
    setMode('idle')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="photo-capture">
      <div className="photo-frame">
        {mode === 'camera' ? (
          <video ref={videoRef} autoPlay playsInline muted className="photo-video" />
        ) : photo ? (
          <img src={photo} alt="Applicant" className="photo-preview" />
        ) : (
          <div className="photo-placeholder">
            <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 3l-1.83 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
              />
            </svg>
            <span>2x2 ID Photo</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="photo-actions">
        {mode === 'camera' ? (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={capture}>
              Capture
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelCamera}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={startCamera}>
              Take Photo
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </button>
            {photo && (
              <button type="button" className="btn btn-text btn-sm" onClick={removePhoto}>
                Remove
              </button>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {error && <p className="photo-error">{error}</p>}
    </div>
  )
}
