import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Users, FolderOpen, TrendingUp, Mail, BarChart3, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminStats,
})

function AdminStats() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data),
  })

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users, color: '192,132,252' },
    { label: 'Total Projects', value: stats?.total_projects ?? '—', icon: FolderOpen, color: '59,130,246' },
    { label: 'Total Subscribers', value: stats?.total_subscribers ?? '—', icon: TrendingUp, color: '34,197,94' },
    { label: 'Emails Sent', value: stats?.total_emails_sent ?? '—', icon: Mail, color: '251,191,36' },
  ]

  const merged = mergeByDate(
    stats?.user_growth?.map((d: any) => ({ date: d.date, Users: d.count })) || [],
    stats?.subscriber_growth?.map((d: any) => ({ date: d.date, Subscribers: d.count })) || [],
  )

  return (
    <div className="fade-in-up">
      {/* Stat cards */}
      <div
        className="stagger"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card" aria-hidden="true">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 90, height: 13, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                </div>
                <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 8 }} />
              </div>
            ))
          : statCards.map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 500 }}>{s.label}</span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `rgba(${s.color},0.1)`,
                      border: `1px solid rgba(${s.color},0.15)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <s.icon size={15} color={`rgb(${s.color})`} />
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                </div>
              </div>
            ))}
      </div>

      {/* Growth chart */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Growth trends</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>
              New users and subscribers over the last 30 days
            </p>
          </div>
          {!isLoading && !isError && merged.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <LegendDot color="#c084fc" label="Users" />
              <LegendDot color="#4ade80" label="Subscribers" />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-md)' }} aria-label="Loading chart" />
        ) : isError ? (
          <div
            style={{
              height: 260,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={22} color="#f87171" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>Couldn't load platform stats</p>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-faint)', fontSize: 13 }}>Check your connection and try again.</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => refetch()} style={{ marginTop: 4 }}>
              Retry
            </button>
          </div>
        ) : merged.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={merged} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="transparent" tickLine={false} tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} />
              <YAxis stroke="transparent" tickLine={false} tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} allowDecimals={false} width={40} />
              <Tooltip
                cursor={{ fill: 'rgba(192,132,252,0.06)' }}
                contentStyle={{
                  background: 'rgba(28,22,38,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  fontSize: 13,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: 'var(--ink-soft)' }}
              />
              <Legend wrapperStyle={{ fontSize: 13, color: 'var(--ink-muted)' }} />
              <Bar dataKey="Users" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Subscribers" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: 260,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(192,132,252,0.08)',
                border: '1px solid rgba(192,132,252,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={22} color="#c084fc" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>No growth data yet</p>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-faint)', fontSize: 13 }}>
                Trends will appear here as users and subscribers sign up.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>{label}</span>
    </span>
  )
}

function mergeByDate(a: any[], b: any[]) {
  const map: Record<string, any> = {}
  for (const item of a) map[item.date] = { ...map[item.date], date: formatDate(item.date), Users: item.Users }
  for (const item of b) map[item.date] = { ...map[item.date], date: formatDate(item.date), Subscribers: item.Subscribers }
  return Object.values(map).sort((x, y) => x.date.localeCompare(y.date))
}
