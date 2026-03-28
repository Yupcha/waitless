import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Mail, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

export const Route = createFileRoute('/dashboard/projects/$id/emails')({
  component: EmailLogsPage,
})

function EmailLogsPage() {
  const { id } = Route.useParams()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['email-logs', id, page],
    queryFn: () => api.get(`/dashboard/projects/${id}/emails`, { params: { page } }).then(r => r.data),
  })

  const logs: any[] = data?.logs || []
  const total: number = data?.total || 0
  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Email Logs</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>{total} emails tracked</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Recipient</th>
              <th>Template</th>
              <th>Subject</th>
              <th>Error</th>
              <th>Sent At</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <Mail size={32} color="#334155" style={{ marginBottom: 8 }} /><br />
                No emails sent yet
              </td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id}>
                <td>
                  {log.status === 'sent' ? (
                    <span className="badge badge-green"><CheckCircle size={12} /> Sent</span>
                  ) : (
                    <span className="badge badge-red"><XCircle size={12} /> Failed</span>
                  )}
                </td>
                <td style={{ color: '#94a3b8', fontSize: 13 }}>{log.recipient}</td>
                <td><span className="badge badge-purple">{log.template}</span></td>
                <td style={{ color: '#e2e8f0', fontSize: 13 }}>{log.subject || '—'}</td>
                <td style={{ color: '#f87171', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.error || '—'}
                </td>
                <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(log.sent_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{total} emails</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '6px 12px' }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{page} / {totalPages}</span>
              <button className="btn-secondary" style={{ padding: '6px 12px' }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
