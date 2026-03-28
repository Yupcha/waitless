import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { FolderOpen } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin/projects')({
  component: AdminProjects,
})

function AdminProjects() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => adminApi.projects().then(r => r.data),
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <FolderOpen size={22} color="#818cf8" />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>All Projects</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{(projects as any[]).length} projects across all accounts</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Subscribers</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</td></tr>
            ) : (projects as any[]).map((p: any) => (
              <tr key={p.id}>
                <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: '#94a3b8', fontSize: 13 }}>{p.user?.email || '—'}</td>
                <td><code style={{ fontSize: 12, color: '#818cf8' }}>/{p.slug}</code></td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{p.subscriber_count}</td>
                <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
