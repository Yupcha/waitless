import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Users, FolderOpen, TrendingUp, Mail, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminStats,
})

function AdminStats() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data),
  })

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: Users, color: '99,102,241' },
    { label: 'Total Projects', value: stats?.total_projects ?? '—', icon: FolderOpen, color: '59,130,246' },
    { label: 'Total Subscribers', value: stats?.total_subscribers ?? '—', icon: TrendingUp, color: '34,197,94' },
    { label: 'Emails Sent', value: stats?.total_emails_sent ?? '—', icon: Mail, color: '251,191,36' },
  ]

  const merged = mergeByDate(
    stats?.user_growth?.map((d: any) => ({ date: d.date, Users: d.count })) || [],
    stats?.subscriber_growth?.map((d: any) => ({ date: d.date, Subscribers: d.count })) || [],
  )

  return (
    <div>
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
            <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              {s.value?.toLocaleString?.() ?? s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Growth — Last 30 Days</h3>
        {merged.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={merged}>
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis stroke="transparent" tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: 13, color: '#64748b' }} />
              <Bar dataKey="Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Subscribers" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <BarChart3 size={28} color="#334155" />
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>No data yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function mergeByDate(a: any[], b: any[]) {
  const map: Record<string, any> = {}
  for (const item of a) map[item.date] = { ...map[item.date], date: formatDate(item.date), Users: item.Users }
  for (const item of b) map[item.date] = { ...map[item.date], date: formatDate(item.date), Subscribers: item.Subscribers }
  return Object.values(map).sort((x, y) => x.date.localeCompare(y.date))
}
