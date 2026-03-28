import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Users, TrendingUp, Mail, BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/')({
  component: ProjectOverview,
})

function ProjectOverview() {
  const { id } = Route.useParams()

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => projectsApi.stats(id).then(r => r.data),
  })

  const statCards = [
    { label: 'Total Subscribers', value: stats?.total_subscribers ?? '—', icon: Users, color: '99,102,241' },
    { label: 'Active', value: stats?.active_subscribers ?? '—', icon: TrendingUp, color: '34,197,94' },
    { label: 'Emails Sent', value: stats?.emails_sent ?? '—', icon: Mail, color: '59,130,246' },
    { label: 'Unsubscribed', value: stats?.unsubscribed ?? '—', icon: BarChart3, color: '239,68,68' },
  ]

  const chartData = stats?.daily_signups?.map((d: any) => ({
    date: formatDate(d.date),
    Signups: d.count,
  })) || []

  return (
    <div>
      {/* Stat cards */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{s.label}</span>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `rgba(${s.color},0.1)`, border: `1px solid rgba(${s.color},0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={15} color={`rgb(${s.color})`} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
          Signups — Last 30 Days
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="Signups" stroke="#6366f1" strokeWidth={2} fill="url(#signupGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: 260, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <BarChart3 size={28} color="#334155" />
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>No signup data yet. Share your waitlist page to start collecting!</p>
          </div>
        )}
      </div>
    </div>
  )
}
