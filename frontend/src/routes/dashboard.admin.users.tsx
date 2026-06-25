import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Users,
  Search,
  ShieldCheck,
  User as UserIcon,
  FolderKanban,
  Mail,
  AlertCircle,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin/users')({
  component: AdminUsers,
})

function AdminUsers() {
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users().then(r => r.data),
  })

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')

  const allUsers = users as any[]

  const stats = useMemo(() => {
    const total = allUsers.length
    const admins = allUsers.filter(u => u.role === 'admin').length
    const projects = allUsers.reduce((acc, u) => acc + (Number(u.project_count) || 0), 0)
    const subscribers = allUsers.reduce((acc, u) => acc + (Number(u.subscriber_count) || 0), 0)
    return { total, admins, projects, subscribers }
  }, [allUsers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allUsers.filter(u => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      if (!matchesRole) return false
      if (!q) return true
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      )
    })
  }, [allUsers, search, roleFilter])

  const roleTabs: { key: 'all' | 'admin' | 'user'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'admin', label: 'Admins' },
    { key: 'user', label: 'Members' },
  ]

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        <div className="icon-tile" aria-hidden="true">
          <Users size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            All Users
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)', fontSize: 14 }}>
            Manage everyone with a Waitless account.
          </p>
        </div>
      </header>

      {/* Stats */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
        className="stagger"
      >
        <StatCard
          icon={<Users size={18} />}
          label="Total accounts"
          value={stats.total}
          loading={isLoading}
          color="#c084fc"
        />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label="Admins"
          value={stats.admins}
          loading={isLoading}
          color="#ff6b9d"
        />
        <StatCard
          icon={<FolderKanban size={18} />}
          label="Projects"
          value={stats.projects}
          loading={isLoading}
          color="#818cf8"
        />
        <StatCard
          icon={<Mail size={18} />}
          label="Total subscribers"
          value={stats.subscribers}
          loading={isLoading}
          color="#4ade80"
        />
      </section>

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
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
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
          <input
            className="input"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            style={{ paddingLeft: 40 }}
          />
        </div>

        <div className="tabs" role="tablist" aria-label="Filter by role" style={{ marginBottom: 0 }}>
          {roleTabs.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={roleFilter === t.key}
              className={cn('tab', roleFilter === t.key && 'active')}
              onClick={() => setRoleFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Projects</th>
                <th style={{ textAlign: 'right' }}>Subscribers</th>
                <th>Joined</th>
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
                          style={{ height: 14, width: j === 0 ? '70%' : '50%', borderRadius: 6 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<AlertCircle size={26} />}
                      title="Couldn't load users"
                      message="Something went wrong fetching the user list. Try refreshing the page."
                      tone="error"
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Users size={26} />}
                      title={search || roleFilter !== 'all' ? 'No matching users' : 'No users yet'}
                      message={
                        search || roleFilter !== 'all'
                          ? 'Try a different search term or clear your filters.'
                          : 'Registered accounts will appear here as people sign up.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-full)',
                            flexShrink: 0,
                            background:
                              u.role === 'admin'
                                ? 'linear-gradient(135deg, #ff6b9d 0%, #c084fc 100%)'
                                : 'rgba(255,255,255,0.06)',
                            color: u.role === 'admin' ? '#fff' : 'var(--ink-muted)',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {(u.name || u.email || '?').charAt(0).toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                          {u.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-soft)' }}>{u.email}</td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          u.role === 'admin' ? 'badge-purple' : 'badge-gray',
                        )}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink)', fontWeight: 600, textAlign: 'right' }}>
                      {u.project_count}
                    </td>
                    <td style={{ color: 'var(--ink)', fontWeight: 600, textAlign: 'right' }}>
                      {u.subscriber_count}
                    </td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && !isError && filtered.length > 0 && (
        <p style={{ margin: '14px 2px 0', color: 'var(--ink-faint)', fontSize: 13 }}>
          Showing {filtered.length} of {allUsers.length} {allUsers.length === 1 ? 'user' : 'users'}
        </p>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  loading,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  loading?: boolean
  color: string
}) {
  return (
    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 42,
          height: 42,
          borderRadius: 'var(--radius-md)',
          background: `${color}1f`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--ink-muted)', fontSize: 12.5, fontWeight: 500 }}>{label}</div>
        {loading ? (
          <div className="skeleton" style={{ height: 22, width: 48, borderRadius: 6, marginTop: 4 }} />
        ) : (
          <div style={{ color: 'var(--ink)', fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>
            {value.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  message,
  tone = 'default',
}: {
  icon: React.ReactNode
  title: string
  message: string
  tone?: 'default' | 'error'
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '56px 24px',
        gap: 6,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-full)',
          marginBottom: 6,
          background: tone === 'error' ? 'rgba(248,113,113,0.12)' : 'rgba(192,132,252,0.12)',
          color: tone === 'error' ? '#f87171' : '#c084fc',
        }}
      >
        {icon}
      </span>
      <div style={{ color: 'var(--ink)', fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ color: 'var(--ink-muted)', fontSize: 14, maxWidth: 380 }}>{message}</div>
    </div>
  )
}
