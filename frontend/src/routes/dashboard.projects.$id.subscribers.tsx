import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscribersApi } from '@/lib/api'
import React, { useState } from 'react'
import { Search, Download, Trash2, UserX, UserCheck, ChevronLeft, ChevronRight, ChevronDown, XCircle, Users, AlertTriangle } from 'lucide-react'
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
  const [confirmModal, setConfirmModal] = useState<{ title: string, content: string, danger?: boolean, onConfirm: () => void } | null>(null)

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

  const hasFilters = !!(search || statusFilter || countryFilter)

  return (
    <div className="fade-in" style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Subscribers
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)' }}>
            Everyone on your waitlist — search, filter, and manage signups{!isLoading && total > 0 ? ` (${total.toLocaleString()} total)` : ''}.
          </p>
        </div>
        <a
          href={subscribersApi.export(id)}
          download
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
        >
          <Download size={15} /> Export CSV
        </a>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            aria-label="Search subscribers"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ paddingLeft: 40 }}
          />
        </div>

        <select
          className="input"
          aria-label="Filter by status"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>

        <input
          className="input"
          aria-label="Filter by country code"
          placeholder="Country"
          style={{ width: 110 }}
          value={countryFilter}
          onChange={e => { setCountryFilter(e.target.value.toUpperCase()); setPage(1) }}
        />
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div
          className="fade-in"
          style={{
            display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap',
            padding: '12px 16px',
            background: 'rgba(192,132,252,0.1)',
            border: '1px solid rgba(192,132,252,0.22)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#d8b4fe', marginRight: 4 }}>
            {selected.length} selected
          </span>
          <button className="btn-secondary" style={{ padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => handleBulk('unsubscribe')}>
            <UserX size={14} /> Unsubscribe
          </button>
          <button className="btn-secondary" style={{ padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => handleBulk('resubscribe')}>
            <UserCheck size={14} /> Resubscribe
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-danger" style={{ padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              if (selected.length === 0) { toast.error('Select subscribers first'); return }
              setConfirmModal({
                title: 'Delete Subscribers',
                content: `Are you sure you want to delete ${selected.length} subscribers?`,
                danger: true,
                onConfirm: () => { handleBulk('delete'); setConfirmModal(null); }
              })
            }}>
            <Trash2 size={14} /> Delete
          </button>
          <button className="btn-danger" style={{ padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.2)' }}
            onClick={() => {
              if (selected.length === 0) { toast.error('Select subscribers first'); return }
              setConfirmModal({
                title: 'Permanently Delete Subscribers',
                content: `Are you sure you want to completely erase ${selected.length} subscribers? This action cannot be undone.`,
                danger: true,
                onConfirm: () => { handleBulk('delete_permanent'); setConfirmModal(null); }
              })
            }}>
            <XCircle size={14} /> Delete Permanently
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all subscribers"
                    checked={selected.length === subscribers.length && subscribers.length > 0}
                    onChange={selectAll}
                    style={{ cursor: 'pointer', accentColor: '#c084fc' }}
                  />
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} /></td>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ width: j === 1 ? 140 : 70, height: 14, borderRadius: 6 }} /></td>
                    ))}
                    <td><div className="skeleton" style={{ width: 40, height: 14, borderRadius: 6 }} /></td>
                  </tr>
                ))
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 24px', gap: 16 }}>
                      <div className="icon-tile" style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
                        <Users size={26} color="#d8b4fe" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                          {hasFilters ? 'No matching subscribers' : 'No subscribers yet'}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)', maxWidth: 360 }}>
                          {hasFilters
                            ? 'Try adjusting your search or filters to find who you’re looking for.'
                            : 'Once people join your waitlist, they’ll show up right here.'}
                        </p>
                      </div>
                      {hasFilters && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 16px' }}
                          onClick={() => { setSearch(''); setStatusFilter(''); setCountryFilter(''); setPage(1) }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : subscribers.map((s: any) => (
                <React.Fragment key={s.id}>
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.email}`}
                      checked={selected.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      style={{ cursor: 'pointer', accentColor: '#c084fc' }}
                    />
                  </td>
                  <td style={{ color: 'var(--ink)', fontWeight: 500, cursor: s.custom_data ? 'pointer' : 'default' }}
                    onClick={() => s.custom_data && setExpanded(expanded === s.id ? null : s.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s.custom_data && <ChevronDown size={13} color="var(--ink-faint)" style={{ transform: expanded === s.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />}
                      {s.name || '—'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-soft)' }}>{s.email}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'deleted' ? 'badge-red' : 'badge-gray'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {s.promo_used ? (
                      <span className="badge badge-yellow">{s.promo_used}</span>
                    ) : <span style={{ color: 'var(--ink-dim)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {s.coupon_code ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{s.coupon_code}</code>
                        <span className={`badge ${s.coupon_status === 'used' ? 'badge-green' : s.coupon_status === 'revoked' ? 'badge-red' : 'badge-gray'}`}
                          style={{ fontSize: 10 }}>
                          {s.coupon_status}
                        </span>
                      </div>
                    ) : <span style={{ color: 'var(--ink-dim)' }}>—</span>}
                  </td>
                  <td>
                    <span className="badge badge-purple">{s.source}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'monospace' }}>
                    {s.ip_address || '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {s.country ? (
                      <span style={{ color: 'var(--ink-soft)' }}>{s.country}</span>
                    ) : <span style={{ color: 'var(--ink-dim)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--ink-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        aria-label="Delete subscriber"
                        onClick={() => setConfirmModal({
                          title: 'Delete Subscriber',
                          content: 'Are you sure you want to delete this subscriber?',
                          danger: true,
                          onConfirm: () => { deleteMutation.mutate(s.id); setConfirmModal(null); }
                        })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 6, borderRadius: 8, transition: 'color .15s, background .15s', display: 'inline-flex' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.background = 'none' }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        aria-label="Permanently delete subscriber"
                        onClick={() => setConfirmModal({
                          title: 'Permanently Delete',
                          content: 'Are you sure you want to permanently erase this subscriber? This cannot be undone.',
                          danger: true,
                          onConfirm: () => { deletePermanentMutation.mutate(s.id); setConfirmModal(null); }
                        })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 6, borderRadius: 8, transition: 'background .15s', display: 'inline-flex' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                        title="Permanently Delete"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === s.id && s.custom_data && (() => {
                  try {
                    const cd = typeof s.custom_data === 'string' ? JSON.parse(s.custom_data) : s.custom_data
                    const entries = Object.entries(cd)
                    if (entries.length === 0) return null
                    return (
                      <tr>
                        <td colSpan={11} style={{ padding: '10px 16px 14px 48px', background: 'rgba(192,132,252,0.04)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                            {entries.map(([k, v]) => (
                              <div key={k} style={{ fontSize: 12 }}>
                                <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>{k}:</span>{' '}
                                <span style={{ color: 'var(--ink-soft)' }}>{String(v)}</span>
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
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{total.toLocaleString()} subscribers total</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-secondary" aria-label="Previous page" style={{ padding: '6px 12px', display: 'inline-flex' }}
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: 14, color: 'var(--ink-soft)', minWidth: 64, textAlign: 'center' }}>{page} / {totalPages}</span>
              <button className="btn-secondary" aria-label="Next page" style={{ padding: '6px 12px', display: 'inline-flex' }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }} onClick={() => setConfirmModal(null)} />
          <div className="card fade-in" style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(420px, calc(100vw - 32px))', zIndex: 1000, padding: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.55)'
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={20} color="#f87171" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{confirmModal.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{confirmModal.content}</p>
              </div>
            </div>
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
