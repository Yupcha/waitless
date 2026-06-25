import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Server, ShieldCheck, Zap } from 'lucide-react'
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

  const features = [
    { icon: Server, title: 'Bring your own SMTP', desc: 'Send from your domain — no third-party sender locks you in.' },
    { icon: Zap, title: 'Launch in minutes', desc: 'Drop-in widget, instant signup capture, zero config.' },
    { icon: ShieldCheck, title: 'Self-hosted & yours', desc: 'Your data stays on your infrastructure, always.' },
  ]

  return (
    <div className="auth-layout">
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      {/* Art panel */}
      <div className="auth-art">
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 48 }} className="fade-in-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <img
              src="/logo.png"
              style={{
                width: 56, height: 56, borderRadius: 16, display: 'block',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
              alt="Waitless logo"
            />
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#f5f3f7' }}>
              Waitless
            </span>
          </div>

          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            The waitlist platform
            <br />
            <span className="gradient-text-brand">you actually own.</span>
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 16, lineHeight: 1.6, margin: '16px 0 40px', maxWidth: 360 }}>
            Self-hosted waitlists with your own SMTP. Collect signups, send updates, and keep full control.
          </p>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }} className="stagger">
            {features.map(f => (
              <li key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span className="icon-tile" style={{ flex: 'none' }}>
                  <f.icon size={20} />
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>{f.title}</div>
                  <div style={{ color: 'var(--ink-faint)', fontSize: 13.5, lineHeight: 1.5, marginTop: 2 }}>{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          {/* Brand mark (visible on narrow screens where art panel is hidden) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <img
              src="/logo.png"
              style={{ width: 40, height: 40, borderRadius: 12, display: 'block', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
              alt="Waitless"
            />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Waitless</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {showForgot ? 'Reset your password' : 'Welcome back'}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--ink-faint)', fontSize: 15 }}>
              {showForgot
                ? "Enter your email and we'll send you a reset link."
                : 'Sign in to manage your waitlists.'}
            </p>
          </div>

          {showForgot ? (
            forgotSent ? (
              <div className="card-glow" style={{ padding: 32, textAlign: 'center' }}>
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 16, background: 'rgba(74,222,128,0.12)',
                    border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 18px', color: '#4ade80',
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <p style={{ color: 'var(--ink)', fontSize: 17, margin: '0 0 8px', fontWeight: 700 }}>Check your inbox</p>
                <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
                  If that email is registered, a reset link is on its way. It may take a minute to arrive.
                </p>
                <button
                  className="btn-secondary"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => { setShowForgot(false); setForgotSent(false) }}
                >
                  <ArrowLeft size={16} /> Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label htmlFor="forgot-email" className="field-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
                    <input
                      id="forgot-email"
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: 13, fontSize: 15, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending link…</>
                  ) : (
                    <>Send reset link <ArrowRight size={16} /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="btn-ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}
                >
                  <ArrowLeft size={15} /> Back to sign in
                </button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label htmlFor="email" className="field-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
                    <input
                      id="email"
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <label htmlFor="password" className="field-label" style={{ marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                      style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 600 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{ paddingLeft: 42, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4, display: 'inline-flex' }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: 13, fontSize: 15, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Signing in…</>
                  ) : (
                    <>Sign in <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--ink-faint)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
