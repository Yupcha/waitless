import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.data),
    retry: false,
  })

  useEffect(() => {
    if (user) navigate({ to: '/dashboard' })
  }, [user])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.login({ email, password })
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(forgotEmail)
      setForgotSent(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Art panel */}
      <div className="auth-art">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 40 }}>
          <img src="/logo.png" 
            style={{ 
              width: 128, height: 128, borderRadius: 24, margin: '0 auto 24px', display: 'block',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }} 
            alt="Waitless Logo" 
          />
          <p style={{ color: '#64748b', fontSize: 15, margin: 0, maxWidth: 280 }}>
            Self-hosted waitlist platform with your own SMTP
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: 36 }}>
            {/* Mobile logo */}
            <div className="auth-art" style={{
              display: 'none', width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
              marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', flex: 'none',
              minHeight: 'auto', border: 'none',
            }}>
              <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Waitless" />
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              {showForgot ? 'Reset password' : 'Welcome back'}
            </h1>
            <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15 }}>
              {showForgot ? 'Enter your email to receive a reset link' : 'Sign in to your account'}
            </p>
          </div>

          {showForgot ? (
            forgotSent ? (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span style={{ fontSize: 24 }}>✓</span>
                </div>
                <p style={{ color: '#4ade80', fontSize: 15, margin: '0 0 8px', fontWeight: 600 }}>Check your inbox</p>
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>If that email is registered, a reset link has been sent.</p>
                <button className="btn-secondary" style={{ width: '100%' }}
                  onClick={() => { setShowForgot(false); setForgotSent(false) }}>
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Email</label>
                  <input type="email" className="input" placeholder="you@example.com" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: 12, fontSize: 15, width: '100%' }} disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
                <button type="button" onClick={() => setShowForgot(false)}
                  style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 14, padding: 0, textAlign: 'center' }}>
                  ← Back to login
                </button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Email</label>
                  <input type="email" className="input" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Password</label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 500 }}>
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} className="input" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: 12, fontSize: 15, width: '100%' }} disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: '#475569' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
