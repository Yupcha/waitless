import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Mail, CheckCircle, XCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
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
    <div style={{ maxWidth: 1100 }}>
      {/* Page header */}
      <header
        className="topbar fade-in"
        style={{ marginBottom: 24, padding: 0, border: 'none', background: 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="icon-tile" aria-hidden="true">
            <Mail size={20} color="#d8b4fe" />
          </span>
          <div>
            <h2 className="topbar-title" style={{ margin: 0 }}>Email Logs</h2>
            <p className="topbar-subtitle" style={{ margin: '2px 0 0' }}>
              Every transactional email sent for this project, with delivery status.
            </p>
          </div>
        </div>
        <span
          className="badge badge-purple"
          style={{ alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}
        >
          {total.toLocaleString()} tracked
        </span>
      </header>

      {/* Logs table */}
      <div className="card fade-in-up" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 760 }}>
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: 16, width: j === 0 ? 64 : j === 3 ? 180 : 120, borderRadius: 6 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        padding: '56px 24px',
                        textAlign: 'center',
                      }}
                    >
                      <span className="icon-tile" aria-hidden="true">
                        <Mail size={22} color="#6f6680" />
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f5f3f7' }}>
                          No emails sent yet
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9a91a8', maxWidth: 360 }}>
                          Once your project starts sending confirmations, invites, or campaigns,
                          they will show up here with their delivery status.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id}>
                    <td>
                      {log.status === 'sent' ? (
                        <span className="badge badge-green"><CheckCircle size={12} /> Sent</span>
                      ) : (
                        <span className="badge badge-red"><XCircle size={12} /> Failed</span>
                      )}
                    </td>
                    <td style={{ color: '#c9c2d4', fontSize: 13, whiteSpace: 'nowrap' }}>{log.recipient}</td>
                    <td><span className="badge badge-purple">{log.template}</span></td>
                    <td style={{ color: '#f5f3f7', fontSize: 13 }}>{log.subject || '—'}</td>
                    <td
                      title={log.error || undefined}
                      style={{
                        color: log.error ? '#f87171' : '#6f6680',
                        fontSize: 12,
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.error ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                          {log.error}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ color: '#9a91a8', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(log.sent_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ fontSize: 13, color: '#9a91a8' }}>
              {total.toLocaleString()} emails total
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px' }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, color: '#c9c2d4', fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'center' }}>
                Page {page} / {totalPages}
              </span>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px' }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
