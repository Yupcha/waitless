import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin/users')({
  component: AdminUsers,
})

function AdminUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.users().then(r => r.data),
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Users size={22} color="#818cf8" />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>All Users</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{(users as any[]).length} registered accounts</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Projects</th>
              <th>Total Subscribers</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</td></tr>
            ) : (users as any[]).map((u: any) => (
              <tr key={u.id}>
                <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{u.name || '—'}</td>
                <td style={{ color: '#94a3b8' }}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{u.project_count}</td>
                <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{u.subscriber_count}</td>
                <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
