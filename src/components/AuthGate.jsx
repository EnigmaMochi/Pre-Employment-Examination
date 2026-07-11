import { useState } from 'react'
import LoginPage from './LoginPage.jsx'
import { getCurrentUser, logout } from '../utils/auth.js'
import './AuthGate.css'

export default function AuthGate({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />
  }

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate-topbar">
        <span className="auth-gate-user">
          Signed in as <strong>{user.name}</strong>
        </span>
        <button type="button" className="auth-gate-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
      {children}
    </div>
  )
}
