import { FormEvent, useState } from 'react'
import { LockKeyhole, UserRound, Zap } from 'lucide-react'

export type AppUser = { username: string; name: string; role: 'ADMIN' | 'USER' }
export type StoredUser = AppUser & { password: string }

export default function Login({ users, onLogin }: { users: StoredUser[]; onLogin: (user: AppUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const normalizedUsername = username.trim().toLowerCase()
    const account = users.find((candidate) => candidate.username.toLowerCase() === normalizedUsername && candidate.password === password)
    if (!account) { setError('Invalid username or password.'); return }
    const { password: _password, ...safeAccount } = account
    onLogin(safeAccount)
  }

  return <main className="login-shell"><section className="login-panel"><div className="login-brand"><div className="brand-mark"><Zap size={18} /></div><div><strong>tft<span>desk</span></strong><small>transport operations</small></div></div><div className="login-copy"><div className="eyebrow">SECURE WORKSPACE</div><h1>Welcome back.</h1><p>Sign in to manage transportation requests and approvals.</p></div><form onSubmit={submit}><label>Username<div className="login-input"><UserRound size={16} /><input value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} autoComplete="username" placeholder="Enter username" /></div></label><label>Password<div className="login-input"><LockKeyhole size={16} /><input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} autoComplete="current-password" placeholder="Enter password" /></div></label>{error && <div className="login-error">{error}</div>}<button className="primary-button login-submit">Sign in</button></form></section><aside className="login-aside"><div className="login-aside-mark">TFT</div><h2>Transportation requests,<br /><em>kept in motion.</em></h2><p>A clear digital record from first route to final approval.</p></aside></main>
}
