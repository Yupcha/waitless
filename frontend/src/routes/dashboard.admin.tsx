import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Shield, Users, FolderOpen, BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminLayout,
})

const tabs = [
  { label: 'Overview', to: '/dashboard/admin', icon: BarChart3 },
  { label: 'Users', to: '/dashboard/admin/users', icon: Users },
  { label: 'Projects', to: '/dashboard/admin/projects', icon: FolderOpen },
]

function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="fade-in">
      {/* Admin header */}
      <div className="topbar">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10,
            padding: '5px 12px', borderRadius: 8,
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)',
          }}>
            <Shield size={13} color="#a855f7" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#c084fc' }}>Admin</span>
          </div>
          <div className="topbar-title">Platform Overview</div>
          <div className="topbar-subtitle">Manage all accounts and projects</div>
        </div>
      </div>

      {/* Pill tab nav */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12, padding: 4,
        border: '1px solid rgba(255,255,255,0.05)',
        width: 'fit-content',
      }}>
        {tabs.map(t => {
          const active = pathname === t.to || (t.to !== '/dashboard/admin' && pathname.startsWith(t.to))
          const isIndex = t.to === '/dashboard/admin' && pathname === '/dashboard/admin'
          return (
            <Link key={t.to} to={t.to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              color: (active || isIndex) ? '#e2e8f0' : '#475569',
              background: (active || isIndex) ? 'rgba(168,85,247,0.15)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <t.icon size={14} /> {t.label}
            </Link>
          )
        })}
      </div>

      <Outlet />
    </div>
  )
}
