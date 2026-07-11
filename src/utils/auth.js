import { AUTHORIZED_USERS } from '../data/users.js'

const SESSION_KEY = 'zarate_auth_session'
const ATTEMPTS_KEY = 'zarate_auth_attempts'

const MAX_INPUT_LENGTH = 254
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000 // 1 minute

// ---------------------------------------------------------------------------
// Input hardening
// ---------------------------------------------------------------------------
// This app has no backend or database — AUTHORIZED_USERS is a plain in-memory
// array checked with a strict `===` comparison, never concatenated into a
// query string, so there is no SQL (or NoSQL) query for an attacker to
// inject into. The credential fields still go through sanitizeInput() below
// as defense-in-depth: it strips control/non-printable characters and caps
// length so malformed or oversized input can't be typed into the form.
// Script-injection (XSS) protection comes from React itself, which escapes
// all text it renders — this codebase never uses dangerouslySetInnerHTML,
// innerHTML, or eval on user input.
function sanitizeInput(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip control / non-printable characters
    .slice(0, MAX_INPUT_LENGTH)
}

// ---------------------------------------------------------------------------
// Brute-force lockout
// ---------------------------------------------------------------------------
// Tracks failed sign-in attempts for this browser tab/session. After
// MAX_ATTEMPTS failures in a row, further attempts are blocked for
// LOCKOUT_MS so a script (or an impatient person) can't just hammer the
// login form with guesses.
function readAttempts() {
  try {
    const raw = window.sessionStorage.getItem(ATTEMPTS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed.count !== 'number') return { count: 0, lockedUntil: 0 }
    return parsed
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function writeAttempts(data) {
  window.sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data))
}

function clearAttempts() {
  window.sessionStorage.removeItem(ATTEMPTS_KEY)
}

/** Returns { locked: boolean, secondsLeft: number } without recording an attempt. */
export function getLockoutStatus() {
  const { lockedUntil } = readAttempts()
  const now = Date.now()
  if (lockedUntil && now < lockedUntil) {
    return { locked: true, secondsLeft: Math.ceil((lockedUntil - now) / 1000) }
  }
  return { locked: false, secondsLeft: 0 }
}

/**
 * Attempts to log a user in against the hardcoded AUTHORIZED_USERS list.
 * Stores the session in sessionStorage by default, or localStorage when
 * "remember me" is checked so the person stays signed in on that device.
 */
export function login(rawUsername, rawPassword, rememberMe) {
  const status = getLockoutStatus()
  if (status.locked) {
    return {
      success: false,
      locked: true,
      secondsLeft: status.secondsLeft,
      message: `Too many failed attempts. Try again in ${status.secondsLeft}s.`,
    }
  }

  const username = sanitizeInput(rawUsername).trim()
  const password = sanitizeInput(rawPassword)

  if (!username || !password) {
    return { success: false, message: 'Please enter your username and password.' }
  }

  const normalizedUsername = username.toLowerCase()
  const user = AUTHORIZED_USERS.find(
    (u) => u.username.toLowerCase() === normalizedUsername && u.password === password
  )

  if (!user) {
    const { count } = readAttempts()
    const nextCount = count + 1

    if (nextCount >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_MS
      writeAttempts({ count: 0, lockedUntil })
      return {
        success: false,
        locked: true,
        secondsLeft: Math.ceil(LOCKOUT_MS / 1000),
        message: `Too many failed attempts. Try again in ${Math.ceil(LOCKOUT_MS / 1000)}s.`,
      }
    }

    writeAttempts({ count: nextCount, lockedUntil: 0 })
    return {
      success: false,
      message: 'Incorrect username or password.',
      attemptsLeft: MAX_ATTEMPTS - nextCount,
    }
  }

  clearAttempts()

  const session = { name: user.name, username: user.username, loggedInAt: Date.now() }
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage

  storage.setItem(SESSION_KEY, JSON.stringify(session))
  otherStorage.removeItem(SESSION_KEY)

  return { success: true, user: session }
}

export function logout() {
  window.sessionStorage.removeItem(SESSION_KEY)
  window.localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser() {
  const raw = window.sessionStorage.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    // Defensive check: only trust the shape we expect from login() above.
    if (!parsed || typeof parsed.username !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}
