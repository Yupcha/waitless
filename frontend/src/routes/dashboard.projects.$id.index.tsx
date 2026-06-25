import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Users, TrendingUp, Mail, BarChart3, AlertCircle, Sparkles } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/')({
  component: ProjectOverview,
})

function ProjectOverview() {
  const { id } = Route.useParams()

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => projectsApi.stats(id).then(r => r.data),
  })

  const statCards = [
    { label: 'Total Subscribers', value: stats?.total_subscribers ?? '—', icon: Users, color: '192,132,252' },
    { label: 'Active', value: stats?.active_subscribers ?? '—', icon: TrendingUp, color: '34,197,94' },
    { label: 'Emails Sent', value: stats?.emails_sent ?? '—', icon: Mail, color: '59,130,246' },
    { label: 'Unsubscribed', value: stats?.unsubscribed ?? '—', icon: BarChart3, color: '239,68,68' },
  ]

  const chartData = stats?.daily_signups?.map((d: any) => ({
    date: formatDate(d.date),
    Signups: d.count,
  })) || []

  return (
    <div
      className="fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, width: '100%' }}
    >
      {/* Page header */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
            lineHeight: 1.1,
          }}
        >
          Overview
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)', maxWidth: 560 }}>
          A live snapshot of how your waitlist is growing.
        </p>
      </header>

      {/* Error state */}
      {isError && (
        <div
          className="card fade-in-up"
          role="alert"
          style={{
            padding: 22,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            borderColor: 'rgba(248,113,113,0.25)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={18} color="#f87171" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Couldn’t load your stats</div>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              Something went wrong fetching this project. Try refreshing the page.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <section
        className="stagger"
        aria-label="Waitlist statistics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>{s.label}</span>
              <div
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `rgba(${s.color},0.1)`,
                  border: `1px solid rgba(${s.color},0.18)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <s.icon size={16} color={`rgb(${s.color})`} />
              </div>
            </div>
            {isLoading ? (
              <div className="skeleton" style={{ height: 36, width: '55%', borderRadius: 8 }} />
            ) : (
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Chart */}
      <section className="card" style={{ padding: 'clamp(20px, 4vw, 28px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Signups</h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--ink-faint)' }}>
              New subscribers over the last 30 days
            </p>
          </div>
          {!isLoading && chartData.length > 0 && <span className="badge badge-purple">Last 30 days</span>}
        </div>

        {isLoading ? (
          <div className="skeleton" style={{ height: 260, width: '100%', borderRadius: 'var(--radius-md)' }} />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b9d" stopOpacity={0.35} />
                  <stop offset="55%" stopColor="#c084fc" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="signupStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff6b9d" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tickLine={false} tick={{ fontSize: 11, fill: '#6f6680' }} />
              <YAxis
                stroke="transparent"
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6f6680' }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(192,132,252,0.4)', strokeWidth: 1 }}
                contentStyle={{
                  background: 'rgba(28,22,38,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  fontSize: 13,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                }}
                labelStyle={{ color: '#c9c2d4', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#d8b4fe' }}
              />
              <Area
                type="monotone"
                dataKey="Signups"
                stroke="url(#signupStroke)"
                strokeWidth={2.5}
                fill="url(#signupGrad)"
                activeDot={{ r: 4, fill: '#c084fc', stroke: '#0e0c12', strokeWidth: 2 }}
              />
            </AreaChart>
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
              padding: '0 24px',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(192,132,252,0.1)',
                border: '1px solid rgba(192,132,252,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} color="#c084fc" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-soft)' }}>No signups yet</div>
            <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>
              Share your waitlist page to start collecting subscribers — they’ll show up here in real time.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
