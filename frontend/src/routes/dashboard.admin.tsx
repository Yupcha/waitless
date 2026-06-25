import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Shield, Users, FolderOpen, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Admin header */}
      <div className="topbar">
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(192,132,252,0.12)',
              border: '1px solid rgba(192,132,252,0.22)',
            }}
          >
            <Shield size={13} color="#d8b4fe" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#d8b4fe', letterSpacing: '0.02em' }}>
              Admin
            </span>
          </span>
          <div className="topbar-title gradient-text">Platform Overview</div>
          <div className="topbar-subtitle">Manage every account and project across Waitless</div>
        </div>
      </div>

      {/* Pill tab nav */}
      <nav className="tabs" aria-label="Admin sections" style={{ width: 'fit-content', maxWidth: '100%', marginBottom: 28 }}>
        {tabs.map((t) => {
          const isIndex = t.to === '/dashboard/admin'
          const active = isIndex
            ? pathname === '/dashboard/admin'
            : pathname === t.to || pathname.startsWith(t.to)
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? 'page' : undefined}
              className={cn('tab', active && 'active')}
            >
              <t.icon size={14} />
              {t.label}
            </Link>
          )
        })}
      </nav>

      <Outlet />
    </div>
  )
}
