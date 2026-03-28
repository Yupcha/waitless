import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

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
            Launch your waitlist in minutes. No vendor lock-in.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-in">
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Create account</h1>
            <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15 }}>Start collecting signups in minutes</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Full Name</label>
              <input type="text" className="input" placeholder="Jane Smith" value={name}
                onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Email</label>
              <input type="email" className={`input ${fieldError ? 'input-error' : ''}`} placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); setFieldError('') }} required />
              {fieldError && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444', fontWeight: 500 }}>{fieldError}</p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: 12, fontSize: 15, width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            The first account created becomes the platform admin.
          </p>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#475569' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
