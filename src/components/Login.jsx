import React, { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email) return alert('Please enter an email')
    onLogin(email)
  }

  return (
    <div className="login-box">
      <form onSubmit={submit}>
        <h2>Sign in (simulation)</h2>
        <div className="field">
          <label className="small">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="submit">
            Sign in
          </button>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>
          This local build simulates login. The email you enter becomes the active user.
          To simulate editing someone else's calendar, sign in as a different email and open their calendar.
        </p>
      </form>
    </div>
  )
}
