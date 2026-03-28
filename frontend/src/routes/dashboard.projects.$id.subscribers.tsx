import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscribersApi } from '@/lib/api'
import { useState } from 'react'
import { Search, Download, Trash2, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/subscribers')({
  component: SubscribersPage,
})

function SubscribersPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', id, page, search, statusFilter],
    queryFn: () => subscribersApi.list(id, { page, limit: 50, search, status: statusFilter }).then(r => r.data),
  })

  const subscribers: any[] = data?.subscribers || []
  const total: number = data?.total || 0
  const totalPages = Math.ceil(total / 50)

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }: any) => subscribersApi.bulk(id, action, ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscribers', id] }); setSelected([]) },
  })

  const deleteMutation = useMutation({
    mutationFn: (subId: string) => subscribersApi.delete(id, subId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers', id] }),
  })

  const toggleSelect = (subId: string) => {
    setSelected(s => s.includes(subId) ? s.filter(x => x !== subId) : [...s, subId])
  }

  const selectAll = () => {
    if (selected.length === subscribers.length) setSelected([])
    else setSelected(subscribers.map(s => s.id))
  }

  const handleBulk = (action: string) => {
    if (selected.length === 0) { toast.error('Select subscribers first'); return }
    bulkMutation.mutate({ action, ids: selected },
      { onSuccess: () => toast.success(`${action} applied to ${selected.length} subscribers`) })
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input className="input" placeholder="Search by email or name..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ paddingLeft: 36 }} />
        </div>

        <select className="input" style={{ width: 'auto' }}
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>

        <a
          href={subscribersApi.export(id)}
          download
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <Download size={14} /> Export CSV
        </a>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16,
          padding: '12px 16px', background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10,
        }}>
          <span style={{ fontSize: 14, color: '#818cf8', marginRight: 8 }}>
            {selected.length} selected
          </span>
          <button className="btn-secondary" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => handleBulk('unsubscribe')}>
            <UserX size={13} /> Unsubscribe
          </button>
          <button className="btn-secondary" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => handleBulk('resubscribe')}>
            <UserCheck size={13} /> Resubscribe
          </button>
          <button className="btn-danger" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => { if (confirm(`Delete ${selected.length} subscribers?`)) handleBulk('delete') }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selected.length === subscribers.length && subscribers.length > 0}
                    onChange={selectAll} style={{ cursor: 'pointer' }} />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Source</th>
                <th>Signed Up</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No subscribers found</td></tr>
              ) : subscribers.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{s.name || '—'}</td>
                  <td style={{ color: '#94a3b8' }}>{s.email}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-purple">{s.source}</span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(s.created_at)}</td>
                  <td>
                    <button
                      onClick={() => { if (confirm('Delete this subscriber?')) deleteMutation.mutate(s.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{total} subscribers total</span>
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
