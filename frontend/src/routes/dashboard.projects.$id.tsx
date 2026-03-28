import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { ArrowLeft, Globe, BarChart3, Users, Key, Code2, Settings, Mail, Webhook, Gift, Send } from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/$id')({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { id } = Route.useParams()

  const { data: project } = useQuery({
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

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="topbar" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link to="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#475569', textDecoration: 'none', marginBottom: 12, fontSize: 13,
            transition: 'color 0.15s',
          }}>
            <ArrowLeft size={14} /> All Projects
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: project?.logo_url ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
            }}>
              {project?.logo_url
                ? <img src={project.logo_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{project?.name?.[0] || '?'}</span>
              }
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                {project?.name || '...'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#475569' }}>/{project?.slug}</span>
                <span className={`badge ${project?.status === 'active' ? 'badge-green' : project?.status === 'paused' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                  {project?.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <a
          href={`/w/${project?.slug}`}
          target="_blank"
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', alignSelf: 'flex-end' }}
        >
          <Globe size={14} /> View Page
        </a>
      </div>

      {/* Pill tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 32,
        overflowX: 'auto', paddingBottom: 4,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12, padding: 4,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        {tabs.map(tab => (
          <Link
            key={tab.to}
            to={tab.to}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                color: isActive ? '#e2e8f0' : '#475569',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <tab.icon size={14} />
                {tab.label}
              </div>
            )}
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
