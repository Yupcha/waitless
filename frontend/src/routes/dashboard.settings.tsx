import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { User, Lock, Save } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: user } = useQuery({
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

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      {/* Top bar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Account Settings</div>
          <div className="topbar-subtitle">Manage your profile and security</div>
        </div>
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={15} color="#818cf8" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Profile</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Name</label>
            <input className="input" value={name || user?.name || ''} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Email</label>
            <input className="input" type="email" value={email || user?.email || ''} onChange={e => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ padding: '10px 18px', width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => profileMut.mutate()} disabled={profileMut.isPending}>
            <Save size={14} /> {profileMut.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={15} color="#fbbf24" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Change Password</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Current Password</label>
            <input className="input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>New Password</label>
            <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters" />
          </div>
          <button className="btn-primary" style={{ padding: '10px 18px', width: 'fit-content' }}
            onClick={() => passwordMut.mutate()} disabled={passwordMut.isPending || newPassword.length < 8}>
            {passwordMut.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Role badge */}
      {user?.role === 'admin' && (
        <div style={{ marginTop: 20, fontSize: 13, color: '#475569' }}>
          Role: <span className="badge badge-purple">Platform Admin</span>
        </div>
      )}
    </div>
  )
}
