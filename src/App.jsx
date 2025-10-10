import React, { useEffect, useState } from 'react'
import Login from './components/Login'
import CalendarView from './components/CalendarView'

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('pc_user') || null)
  const [theme, setTheme] = useState(() => localStorage.getItem('pc_theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pc_theme', theme)
  }, [theme])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Personal Calendar</h1>
        <div className="header-controls">
          <button
            className="theme-btn"
            onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌞 Light Theme' : '🌙 Dark Theme'}
          </button>
          {user ? (
            <button
              className="signout"
              onClick={() => {
                localStorage.removeItem('pc_user')
                setUser(null)
              }}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="app-main">
        {!user ? (
          <Login
            onLogin={email => {
              localStorage.setItem('pc_user', email)
              setUser(email)
            }}
          />
        ) : (
          <CalendarView ownerEmail={user} />
        )}
      </main>
    </div>
  )
}

export default App
