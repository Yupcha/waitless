import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscribersApi } from '@/lib/api'
import React, { useState } from 'react'
import { Search, Download, Trash2, UserX, UserCheck, ChevronLeft, ChevronRight, ChevronDown, XCircle } from 'lucide-react'
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
  const [countryFilter, setCountryFilter] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ title: string, content: string, onConfirm: () => void } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', id, page, search, statusFilter, countryFilter],
    queryFn: () => subscribersApi.list(id, { page, limit: 50, search, status: statusFilter, country: countryFilter }).then(r => r.data),
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

  const deletePermanentMutation = useMutation({
    mutationFn: (subId: string) => subscribersApi.delete(id, subId, true),
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
    bulkMutation.mutate({ action, ids: selected }, {
      onSuccess: () => {
        if (action !== 'delete') toast.success(`${action} applied to ${selected.length} subscribers`)
      }
    })
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

        <input className="input" placeholder="Country (US, IN...)" style={{ width: 80 }}
          value={countryFilter} onChange={e => { setCountryFilter(e.target.value.toUpperCase()); setPage(1) }} />

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
            onClick={() => {
              if (selected.length === 0) { toast.error('Select subscribers first'); return }
              setConfirmModal({
                title: 'Delete Subscribers',
                content: `Are you sure you want to delete ${selected.length} subscribers?`,
                onConfirm: () => { handleBulk('delete'); setConfirmModal(null); }
              })
            }}>
            <Trash2 size={13} /> Delete
          </button>
          <button className="btn-danger" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239, 68, 68, 0.2)' }}
            onClick={() => {
              if (selected.length === 0) { toast.error('Select subscribers first'); return }
              setConfirmModal({
                title: 'Permanently Delete Subscribers',
                content: `Are you sure you want to completely erase ${selected.length} subscribers? This action cannot be undone.`,
                onConfirm: () => { handleBulk('delete_permanent'); setConfirmModal(null); }
              })
            }}>
            <XCircle size={13} /> Delete Permanently
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
                <th>Promo</th>
                <th>Coupon</th>
                <th>Source</th>
                <th>IP</th>
                <th>Country</th>
                <th>Signed Up</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No subscribers found</td></tr>
              ) : subscribers.map((s: any) => (
                <React.Fragment key={s.id}>
                <tr>
                  <td>
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ color: '#e2e8f0', fontWeight: 500, cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s.custom_data && <ChevronDown size={12} color="#475569" style={{ transform: expanded === s.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
                      {s.name || '—'}
                    </div>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{s.email}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'deleted' ? 'badge-red' : 'badge-gray'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {s.promo_used ? (
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)',
                      }}>{s.promo_used}</span>
                    ) : <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {s.coupon_code ? (
                      <div>
                        <code style={{ fontSize: 11, color: '#94a3b8' }}>{s.coupon_code}</code>
                        <span className={`badge ${s.coupon_status === 'used' ? 'badge-green' : s.coupon_status === 'revoked' ? 'badge-red' : 'badge-gray'}`}
                          style={{ marginLeft: 4, fontSize: 10 }}>
                          {s.coupon_status}
                        </span>
                      </div>
                    ) : <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td>
                    <span className="badge badge-purple">{s.source}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
                    {s.ip_address || '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {s.country ? (
                      <span style={{ color: '#94a3b8' }}>{s.country}</span>
                    ) : <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(s.created_at)}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => setConfirmModal({
                        title: 'Delete Subscriber',
                        content: 'Are you sure you want to delete this subscriber?',
                        onConfirm: () => { deleteMutation.mutate(s.id); setConfirmModal(null); }
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmModal({
                        title: 'Permanently Delete',
                        content: 'Are you sure you want to permanently erase this subscriber? This cannot be undone.',
                        onConfirm: () => { deletePermanentMutation.mutate(s.id); setConfirmModal(null); }
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                      title="Permanently Delete"
                    >
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
                {expanded === s.id && s.custom_data && (() => {
                  try {
                    const cd = typeof s.custom_data === 'string' ? JSON.parse(s.custom_data) : s.custom_data
                    const entries = Object.entries(cd)
                    if (entries.length === 0) return null
                    return (
                      <tr>
                        <td colSpan={11} style={{ padding: '8px 16px 12px 48px', background: 'rgba(99,102,241,0.03)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                            {entries.map(([k, v]) => (
                              <div key={k} style={{ fontSize: 12 }}>
                                <span style={{ color: '#475569', fontWeight: 500 }}>{k}:</span>{' '}
                                <span style={{ color: '#94a3b8' }}>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  } catch { return null }
                })()}
                </React.Fragment>
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

      {confirmModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }} onClick={() => setConfirmModal(null)} />
          <div className="card" style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, zIndex: 1000, padding: 24, paddingBottom: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>{confirmModal.content}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setConfirmModal(null)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button className="btn-danger" onClick={confirmModal.onConfirm} style={{ padding: '8px 16px' }}>Confirm</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
