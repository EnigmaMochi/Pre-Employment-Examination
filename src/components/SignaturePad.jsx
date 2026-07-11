import { useEffect, useRef, useState } from 'react'

export default function SignaturePad({ label, value, onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPoint = useRef(null)
  const [hasInk, setHasInk] = useState(Boolean(value))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#10302e'

    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = value
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0]
    const clientX = touch ? touch.clientX : e.clientX
    const clientY = touch ? touch.clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    lastPoint.current = getPoint(e)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const point = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPoint.current = point
    setHasInk(true)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    onChange(canvas.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className="signature-pad">
      <div className="signature-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {!hasInk && <span className="signature-hint">Sign here</span>}
        <span className="signature-line" aria-hidden="true" />
      </div>
      <div className="signature-footer">
        <span className="signature-label">{label}</span>
        <button type="button" className="btn btn-text btn-sm" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  )
}
