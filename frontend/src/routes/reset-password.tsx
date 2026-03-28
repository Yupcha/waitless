import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-layout">
        <div className="auth-art">
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 40 }}>
            <img src="/logo.png" 
              style={{ 
                width: 128, height: 128, borderRadius: 24, margin: '0 auto 24px', display: 'block',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }} 
              alt="Waitless Logo" 
            />
          </div>
        </div>
        <div className="auth-form">
          <div style={{ textAlign: 'center', maxWidth: 400 }} className="fade-in">
            <h2 style={{ color: '#e2e8f0', marginBottom: 8, fontSize: 24, fontWeight: 800 }}>Invalid reset link</h2>
            <p style={{ color: '#475569', fontSize: 14, marginBottom: 28 }}>This password reset link is invalid or has expired.</p>
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>Back to login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-layout">
      <div className="auth-art">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 40 }}>
          <img src="/logo.png" 
            style={{ 
              width: 128, height: 128, borderRadius: 24, margin: '0 auto 24px', display: 'block',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }} 
            alt="Waitless Logo" 
          />
          <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Secure password reset</p>
        </div>
      </div>

      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              {done ? 'Password reset!' : 'Set new password'}
            </h1>
            {!done && <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15 }}>Enter your new password below</p>}
          </div>

          {done ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: 24 }}>✓</span>
              </div>
              <p style={{ color: '#4ade80', fontSize: 15, margin: '0 0 8px', fontWeight: 600 }}>Password updated</p>
              <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>You can now sign in with your new password.</p>
              <button className="btn-primary" style={{ width: '100%', padding: 12 }}
                onClick={() => navigate({ to: '/login' })}>
                Sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="input" placeholder="Min 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoFocus
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Confirm Password</label>
                <input type="password" className="input" placeholder="Repeat password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required minLength={8} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: 12, fontSize: 15, width: '100%', marginTop: 4 }} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
