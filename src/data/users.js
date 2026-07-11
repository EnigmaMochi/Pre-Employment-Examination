// Accounts allowed to sign in to the pre-employment examination system.
//
// This is a small internal tool, so accounts are simply listed here
// instead of wiring up a full authentication backend. Add more entries
// to this list if additional staff need access.
//
// ⚠️ Important: this check runs entirely in the browser, so it only keeps
// out casual/accidental visitors — it is NOT a secure login system.
// Do not reuse real/sensitive passwords here, and don't rely on this for
// protecting confidential medical data on its own.
export const AUTHORIZED_USERS = [
  { name: 'Doctor', username: 'Doctor', password: '123456' },
]
