import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { FolderOpen, Search, Users, CheckCircle2, AlertTriangle, FolderX } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin/projects')({
  component: AdminProjects,
})

function AdminProjects() {
  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => adminApi.projects().then(r => r.data),
  })

  const [search, setSearch] = useState('')

  const all = projects as any[]

  const stats = useMemo(() => {
    const total = all.length
    const active = all.filter((p: any) => p.status === 'active').length
    const subscribers = all.reduce((sum: number, p: any) => sum + (p.subscriber_count || 0), 0)
    return { total, active, subscribers }
  }, [all])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((p: any) =>
      [p.name, p.slug, p.user?.email, p.status]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q)),
    )
  }, [all, search])

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div className="topbar" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="icon-tile" aria-hidden="true">
            <FolderOpen size={20} />
          </div>
          <div>
            <h1 className="topbar-title" style={{ margin: 0 }}>All Projects</h1>
            <p className="topbar-subtitle" style={{ margin: '4px 0 0' }}>
              Every project across all accounts, in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatTile
          label="Total projects"
          value={isLoading ? '—' : stats.total.toLocaleString()}
          icon={<FolderOpen size={18} />}
          color="#818cf8"
        />
        <StatTile
          label="Active"
          value={isLoading ? '—' : stats.active.toLocaleString()}
          icon={<CheckCircle2 size={18} />}
          color="#4ade80"
        />
        <StatTile
          label="Total subscribers"
          value={isLoading ? '—' : stats.subscribers.toLocaleString()}
          icon={<Users size={18} />}
          color="#ff6b9d"
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-faint)',
              pointerEvents: 'none',
            }}
          />
          <label htmlFor="project-search" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Search projects
          </label>
          <input
            id="project-search"
            className="input"
            type="search"
            placeholder="Search by name, slug, or owner…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        {!isLoading && !isError && (
          <span style={{ color: 'var(--ink-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
            {filtered.length} of {all.length} shown
          </span>
        )}
      </div>

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Slug</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Subscribers</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: 14, borderRadius: 6, width: j === 0 ? '70%' : '50%' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyRow
                      icon={<AlertTriangle size={26} color="#f87171" />}
                      title="Couldn't load projects"
                      subtitle="Something went wrong fetching the project list. Please refresh and try again."
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyRow
                      icon={<FolderX size={26} color="var(--ink-faint)" />}
                      title={search ? 'No matching projects' : 'No projects yet'}
                      subtitle={
                        search
                          ? 'Try a different name, slug, or owner email.'
                          : 'Projects created by any account will appear here.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{p.user?.email || '—'}</td>
                    <td>
                      <code style={{ fontSize: 12, color: '#818cf8' }}>/{p.slug}</code>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink)', fontWeight: 600, textAlign: 'right' }}>
                      {(p.subscriber_count ?? 0).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 10,
            color,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
          }}
        >
          {icon}
        </span>
        <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}

function EmptyRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          marginBottom: 4,
        }}
      >
        {icon}
      </div>
      <div style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 15 }}>{title}</div>
      <div style={{ color: 'var(--ink-muted)', fontSize: 13, maxWidth: 340 }}>{subtitle}</div>
    </div>
  )
}
