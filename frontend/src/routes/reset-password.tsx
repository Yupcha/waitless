import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ArtPanel({ caption }: { caption: string }) {
  return (
    <div className="auth-art">
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: 40,
          maxWidth: 360,
        }}
        className="fade-in-up"
      >
        <img
          src="/logo.png"
          style={{
            width: 112,
            height: 112,
            borderRadius: 24,
            margin: '0 auto 28px',
            display: 'block',
            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
          }}
          alt="Waitless"
        />
        <h2
          className="gradient-text-brand"
          style={{ margin: '0 0 12px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}
        >
          Waitless
        </h2>
        <p style={{ color: '#c9c2d4', fontSize: 15, margin: 0, lineHeight: 1.6 }}>{caption}</p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            padding: '8px 16px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#9a91a8',
            fontSize: 13,
          }}
        >
          <ShieldCheck size={14} style={{ color: '#c084fc' }} />
          Encrypted &amp; secure by default
        </div>
      </div>
    </div>
  )
}

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

  const mismatch = confirm.length > 0 && password !== confirm
  const tooShort = password.length > 0 && password.length < 8

  // ── Invalid / missing token state ──────────────────────────────
  if (!token) {
    return (
      <div className="auth-layout">
        <ArtPanel caption="Reset links keep your account safe — request a fresh one any time." />

        <div className="auth-form">
          <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
            <div
              className="card"
              style={{ padding: 36, textAlign: 'center' }}
            >
              <div
                className="icon-tile"
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 20px',
                  background: 'rgba(248,113,113,0.12)',
                  borderColor: 'rgba(248,113,113,0.25)',
                  color: '#f87171',
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <h1
                style={{
                  color: '#f5f3f7',
                  margin: '0 0 8px',
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                Link expired or invalid
              </h1>
              <p style={{ color: '#9a91a8', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
                This password reset link is no longer valid. Request a new one and we&apos;ll email you
                a fresh link.
              </p>
              <Link
                to="/login"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  width: '100%',
                  padding: 12,
                }}
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Reset-with-token state ─────────────────────────────────────
  return (
    <div className="auth-layout">
      <ArtPanel caption="Choose a strong new password. You'll be signing in again in seconds." />

      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          {done ? (
            <div className="card" style={{ padding: 36, textAlign: 'center' }}>
              <div
                className="icon-tile"
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 20px',
                  background: 'rgba(74,222,128,0.12)',
                  borderColor: 'rgba(74,222,128,0.25)',
                  color: '#4ade80',
                }}
              >
                <CheckCircle2 size={26} />
              </div>
              <h1
                style={{
                  margin: '0 0 8px',
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#f5f3f7',
                  letterSpacing: '-0.02em',
                }}
              >
                Password updated
              </h1>
              <p style={{ color: '#9a91a8', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
                Your password has been changed. Sign in with your new credentials to continue.
              </p>
              <button
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: 12,
                }}
                onClick={() => navigate({ to: '/login' })}
              >
                <ArrowLeft size={16} />
                Sign in
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <div
                  className="icon-tile"
                  style={{ marginBottom: 18, width: 48, height: 48 }}
                >
                  <KeyRound size={22} />
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#f5f3f7',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Set a new password
                </h1>
                <p style={{ margin: '8px 0 0', color: '#9a91a8', fontSize: 15, lineHeight: 1.6 }}>
                  Pick something secure you haven&apos;t used before.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <div>
                  <label htmlFor="new-password" className="field-label">
                    New password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6f6680',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      id="new-password"
                      type={showPass ? 'text' : 'password'}
                      className={`input${tooShort ? ' input-error' : ''}`}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                      style={{ paddingLeft: 40, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6f6680',
                        padding: 0,
                        display: 'inline-flex',
                      }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {tooShort ? (
                    <p className="error-text">Use at least 8 characters.</p>
                  ) : (
                    <p className="help-text">Mix letters, numbers and symbols for best security.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="field-label">
                    Confirm password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6f6680',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      id="confirm-password"
                      type={showPass ? 'text' : 'password'}
                      className={`input${mismatch ? ' input-error' : ''}`}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                  {mismatch && <p className="error-text">Passwords don&apos;t match yet.</p>}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: 12,
                    fontSize: 15,
                    width: '100%',
                    marginTop: 4,
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'float 1.4s ease-in-out infinite' }} />
                      Resetting…
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>

                <Link
                  to="/login"
                  className="btn-ghost"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
