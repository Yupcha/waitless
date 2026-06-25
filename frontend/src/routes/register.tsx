import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react'

import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const VALUE_POINTS = [
  { icon: Zap, text: 'Launch a branded waitlist in minutes' },
  { icon: ShieldCheck, text: 'Own your data — no vendor lock-in' },
  { icon: Sparkles, text: 'Referrals, emails & analytics built in' },
]

function RegisterPage() {
  const navigate = useNavigate()

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.data),
    retry: false,
  })

  useEffect(() => {
    if (user) navigate({ to: '/dashboard' })
  }, [user])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError('')
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await authApi.register({ name, email, password })
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed'
      if (err.response?.status === 409) {
        setFieldError(msg)
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6f6680',
    pointerEvents: 'none',
  }

  return (
    <div className="auth-layout">
      {/* ── Art panel ── */}
      <div className="auth-art">
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: 48,
            maxWidth: 460,
            width: '100%',
          }}
          className="fade-in-up"
        >
          <img
            src="/logo.png"
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              display: 'block',
              marginBottom: 28,
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            }}
            alt="Waitless"
          />
          <h2
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#f5f3f7',
            }}
          >
            The open-source way to{' '}
            <span className="gradient-text-brand">grow your waitlist</span>.
          </h2>
          <p
            style={{
              margin: '16px 0 36px',
              color: '#c9c2d4',
              fontSize: 16,
              lineHeight: 1.6,
              maxWidth: 380,
            }}
          >
            Capture signups, reward referrals, and turn anticipation into
            customers — all from one calm dashboard.
          </p>

          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {VALUE_POINTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  color: '#c9c2d4',
                  fontSize: 15,
                }}
              >
                <span className="icon-tile" style={{ width: 38, height: 38 }}>
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: '#f5f3f7',
                letterSpacing: '-0.02em',
              }}
            >
              Create your account
            </h1>
            <p style={{ margin: '8px 0 0', color: '#9a91a8', fontSize: 15 }}>
              Start collecting signups in minutes — no credit card required.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div>
              <label htmlFor="name" className="field-label">
                Full name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={iconStyle} aria-hidden="true" />
                <input
                  id="name"
                  type="text"
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={iconStyle} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  className={`input ${fieldError ? 'input-error' : ''}`}
                  style={{ paddingLeft: 42 }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setFieldError('')
                  }}
                  required
                  autoComplete="email"
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? 'email-error' : undefined}
                />
              </div>
              {fieldError && (
                <p
                  id="email-error"
                  className="error-text"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  {fieldError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={iconStyle} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    background: 'transparent',
                    border: 'none',
                    color: '#9a91a8',
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="help-text">
                Use 8 or more characters with a mix of letters and numbers.
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: 13,
                fontSize: 15,
                width: '100%',
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p
            style={{
              fontSize: 12.5,
              color: '#6f6680',
              textAlign: 'center',
              marginTop: 20,
              lineHeight: 1.5,
            }}
          >
            The first account created becomes the platform admin.
          </p>

          <hr className="divider" style={{ margin: '20px 0' }} />

          <p
            style={{
              textAlign: 'center',
              margin: 0,
              fontSize: 14,
              color: '#9a91a8',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
