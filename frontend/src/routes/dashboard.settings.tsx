import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { User, Lock, Save, ShieldCheck, KeyRound } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useState(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  })

  const profileMut = useMutation({
    mutationFn: () => api.put('/auth/me', { name, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const passwordMut = useMutation({
    mutationFn: () => api.put('/auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Password changed')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Page header */}
      <div className="topbar" style={{ marginBottom: 28 }}>
        <div>
          <div className="topbar-title">Account settings</div>
          <div className="topbar-subtitle">Manage your profile details and account security.</div>
        </div>
        {user?.role === 'admin' && (
          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={13} /> Platform Admin
          </span>
        )}
      </div>

      {isLoading && !user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionSkeleton rows={2} />
          <SectionSkeleton rows={2} />
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile */}
          <section className="card fade-in-up" style={{ padding: 28 }}>
            <SectionHeader
              icon={<User size={17} />}
              title="Profile"
              subtitle="This information identifies you across the dashboard."
            />

            <form
              onSubmit={(e) => { e.preventDefault(); profileMut.mutate() }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
            >
              <div>
                <label className="field-label" htmlFor="settings-name">Name</label>
                <input
                  id="settings-name"
                  className="input"
                  value={name || user?.name || ''}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="settings-email">Email</label>
                <input
                  id="settings-email"
                  className="input"
                  type="email"
                  value={email || user?.email || ''}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <p className="help-text">Used for sign-in and account notifications.</p>
              </div>
              <div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  disabled={profileMut.isPending}
                >
                  <Save size={15} /> {profileMut.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Password */}
          <section className="card fade-in-up" style={{ padding: 28 }}>
            <SectionHeader
              icon={<Lock size={17} />}
              iconTone="yellow"
              title="Change password"
              subtitle="Choose a strong password you don't use elsewhere."
            />

            <form
              onSubmit={(e) => { e.preventDefault(); passwordMut.mutate() }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
            >
              <div>
                <label className="field-label" htmlFor="settings-current-password">Current password</label>
                <input
                  id="settings-current-password"
                  className="input"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="settings-new-password">New password</label>
                <input
                  id="settings-new-password"
                  className={`input${passwordTooShort ? ' input-error' : ''}`}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  aria-invalid={passwordTooShort}
                />
                {passwordTooShort ? (
                  <p className="error-text">Password must be at least 8 characters.</p>
                ) : (
                  <p className="help-text">Minimum 8 characters.</p>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  disabled={passwordMut.isPending || newPassword.length < 8}
                >
                  <KeyRound size={15} /> {passwordMut.isPending ? 'Changing…' : 'Change password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
  iconTone = 'violet',
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  iconTone?: 'violet' | 'yellow'
}) {
  const tone = iconTone === 'yellow'
    ? { background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.18)', color: '#facc15' }
    : { background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.18)', color: '#d8b4fe' }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <span
        aria-hidden
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 12, flexShrink: 0, ...tone,
        }}
      >
        {icon}
      </span>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-faint)', lineHeight: 1.5 }}>{subtitle}</p>
      </div>
    </div>
  )
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 200, height: 10, borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 12 }} />
          </div>
        ))}
        <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 999 }} />
      </div>
    </div>
  )
}
