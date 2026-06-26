import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Globe, BarChart3, Users, Key, Code2,
  Settings, Mail, Webhook, Gift, Send, AlertTriangle,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/$id')({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { id } = Route.useParams()

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id).then(r => r.data),
  })

  const tabs = [
    { to: `/dashboard/projects/${id}`, label: 'Overview', icon: BarChart3 },
    { to: `/dashboard/projects/${id}/subscribers`, label: 'Subscribers', icon: Users },
    { to: `/dashboard/projects/${id}/emails`, label: 'Emails', icon: Mail },
    { to: `/dashboard/projects/${id}/smtp`, label: 'SMTP', icon: Mail },
    { to: `/dashboard/projects/${id}/api-keys`, label: 'API Keys', icon: Key },
    { to: `/dashboard/projects/${id}/webhooks`, label: 'Webhooks', icon: Webhook },
    { to: `/dashboard/projects/${id}/coupons`, label: 'Coupons', icon: Gift },
    { to: `/dashboard/projects/${id}/telegram`, label: 'Telegram', icon: Send },
    { to: `/dashboard/projects/${id}/widget`, label: 'Widget', icon: Code2 },
    { to: `/dashboard/projects/${id}/settings`, label: 'Settings', icon: Settings },
  ]

  const statusClass =
    project?.status === 'active' ? 'badge-green'
    : project?.status === 'paused' ? 'badge-yellow'
    : 'badge-gray'

  return (
    <div className="fade-in" style={{ maxWidth: 1160, margin: '0 auto' }}>
      {/* ── Header ── */}
      <header
        className="topbar"
        style={{ flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}
      >
        <div style={{ minWidth: 0 }}>
          <Link
            to="/dashboard"
            className="sidebar-link"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--ink-faint)', textDecoration: 'none',
              marginBottom: 14, fontSize: 13, padding: '4px 8px',
              marginLeft: -8, borderRadius: 'var(--radius-sm)', width: 'fit-content',
            }}
          >
            <ArrowLeft size={14} /> All projects
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            {/* Project avatar */}
            {isLoading ? (
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
            ) : (
              <div
                className="icon-tile"
                style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: project?.logo_url ? '#0e0c12' : 'var(--brand-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                  boxShadow: '0 6px 18px rgba(192,132,252,0.25)',
                }}
              >
                {project?.logo_url ? (
                  <img
                    src={project.logo_url}
                    alt={project.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
                    {project?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            )}

            {/* Title + meta */}
            <div style={{ minWidth: 0 }}>
              {isLoading ? (
                <>
                  <div className="skeleton" style={{ width: 180, height: 24, borderRadius: 8, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6 }} />
                </>
              ) : (
                <>
                  <h1
                    className="topbar-title"
                    style={{
                      margin: 0, fontSize: 24, fontWeight: 800,
                      letterSpacing: '-0.02em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {project?.name || 'Untitled project'}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>/{project?.slug}</span>
                    {project?.status && (
                      <span className={cn('badge', statusClass)} style={{ fontSize: 11 }}>
                        {project.status}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {project?.slug && (
          <a
            href={`/w/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{
              textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', gap: 8, padding: '9px 16px',
            }}
          >
            <Globe size={15} /> View page
          </a>
        )}
      </header>

      {/* ── Pill tabs ── */}
      <nav className="tabs" aria-label="Project sections" style={{ marginBottom: 32 }}>
        {tabs.map(tab => (
          <Link key={tab.to} to={tab.to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <span className={cn('tab', isActive && 'active')}>
                <tab.icon size={14} />
                {tab.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* ── Content ── */}
      {isError ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '56px 24px' }}
        >
          <div
            className="icon-tile"
            style={{
              width: 56, height: 56, margin: '0 auto 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171',
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
            Couldn&apos;t load this project
          </h2>
          <p style={{ margin: '0 auto 20px', maxWidth: 360, fontSize: 14, color: 'var(--ink-muted)' }}>
            Something went wrong fetching the project details. Check your connection and try again.
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
            Back to projects
          </Link>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}
