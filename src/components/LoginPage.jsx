import { useEffect, useRef, useState } from 'react'
import hospitalLogo from '../assets/logozarat-transparent.png'
import { login, getLockoutStatus } from '../utils/auth.js'
import './LoginPage.css'


// Background photo placeholder.
// Drop your own image into the `public` folder of the project as
// `public/login-bg.jpg` (create the `public` folder if it doesn't exist
// yet) — this component will pick it up automatically. Until then, a
// neutral placeholder is shown so the layout still looks right.
const BACKGROUND_SRC = '/login-bg.png'
const MAX_FIELD_LENGTH = 254

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bgMissing, setBgMissing] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef(null)

  // Pick up an in-progress lockout on mount (e.g. the person reloaded the page).
  useEffect(() => {
    const status = getLockoutStatus()
    if (status.locked) startCountdown(status.secondsLeft)
    return () => clearInterval(timerRef.current)
  }, [])

  function startCountdown(seconds) {
    clearInterval(timerRef.current)
    setSecondsLeft(seconds)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const locked = secondsLeft > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (locked) return

    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }

    setSubmitting(true)
    // Small delay so the button gives feedback instead of resolving instantly.
    setTimeout(() => {
      const result = login(username, password, rememberMe)
      setSubmitting(false)
      if (!result.success) {
        setError(result.message)
        if (result.locked) startCountdown(result.secondsLeft)
        return
      }
      onLoginSuccess(result.user)
    }, 250)
  }

  return (
    <div className="login-page">
      {bgMissing ? (
        <div className="login-bg login-bg--placeholder">
          <span className="login-bg-placeholder-title">Background image placeholder</span>
          <span className="login-bg-placeholder-hint">
            Add your photo at <code>public/login-bg.jpg</code>
          </span>
        </div>
      ) : (
        <img
          src={BACKGROUND_SRC}
          alt=""
          className="login-bg"
          onError={() => setBgMissing(true)}
        />
      )}
      <div className="login-bg-overlay" />

      <div className="login-brand">
        <img src={hospitalLogo} alt="" className="login-brand-logo" />
        <div className="login-brand-text">
          <span className="login-brand-name">E.ZARATE</span>
          <span className="login-brand-sub">HOSPITAL</span>
        </div>
      </div>

      <div className="login-card">
        <div className="login-avatar">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
            />
          </svg>
        </div>

        <h1 className="login-title">Welcome</h1>
        <p className="login-subtitle">Sign in to your account</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-field">
            <svg className="login-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={MAX_FIELD_LENGTH}
              disabled={locked}
            />
          </label>

          <label className="login-field">
            <svg className="login-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={MAX_FIELD_LENGTH}
              disabled={locked}
            />
            <button
              type="button"
              className="login-field-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.4 5.5A9.9 9.9 0 0 1 12 5c5 0 8.6 3.4 10 7-.5 1.2-1.3 2.5-2.4 3.6M6.3 6.9C4.2 8.2 2.7 10 2 12c1.4 3.6 5 7 10 7 1.2 0 2.4-.2 3.4-.6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path
                    d="M2 12c1.4-3.6 5-7 10-7s8.6 3.4 10 7c-1.4 3.6-5 7-10 7s-8.6-3.4-10-7z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </label>

          <div className="login-row">
            <label className="login-remember">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="login-forgot"
              onClick={() => setError('Please contact your system administrator to reset your password.')}
            >
              Forgot Password?
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={submitting || locked}>
            {locked ? `Locked — try again in ${secondsLeft}s` : submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
