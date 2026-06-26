import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Gift, Search, Ban, Copy, Check, Plus, Pencil, Trash2, Tag,
  X, Ticket, CheckCircle2, Megaphone, AlertCircle, Inbox,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/coupons')({
  component: CouponsPage,
})

function CouponsPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ title: string, content: string, onConfirm: () => void } | null>(null)

  const defaultForm = {
    promo_code: '', is_default: false, enabled: true,
    discount_type: 'flat', discount_value: 0, currency: 'USD',
    code_prefix: '', code_length: 8, max_codes: 0, valid_days: 0, description: '',
    delivery_method: 'api',
  }
  const [form, setForm] = useState(defaultForm)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => api.get(`/dashboard/projects/${id}/campaigns`).then(r => r.data),
  })

  const campaigns: any[] = data?.campaigns || []
  const totalCodes = data?.total_codes || 0
  const usedCodes = data?.used_codes || 0
  const activeCodes = data?.active_codes || 0

  const createMut = useMutation({
    mutationFn: () => api.post(`/dashboard/projects/${id}/campaigns`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns', id] }); setShowForm(false); setForm(defaultForm); toast.success('Campaign created') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: () => api.put(`/dashboard/projects/${id}/campaigns/${editId}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns', id] }); setShowForm(false); setEditId(null); setForm(defaultForm); toast.success('Campaign updated') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (cid: string) => api.delete(`/dashboard/projects/${id}/campaigns/${cid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns', id] }); toast.success('Campaign deleted') },
  })

  const { data: codesData, isLoading: codesLoading } = useQuery({
    queryKey: ['coupons', id, search, statusFilter, campaignFilter],
    queryFn: () => api.get(`/dashboard/projects/${id}/coupons`, {
      params: { search, status: statusFilter, campaign_id: campaignFilter, limit: 50 },
    }).then(r => r.data),
  })
  const coupons: any[] = codesData?.coupons || []

  const revokeMut = useMutation({
    mutationFn: (cid: string) => api.patch(`/dashboard/projects/${id}/coupons/${cid}/revoke`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons', id] })
      qc.invalidateQueries({ queryKey: ['campaigns', id] })
      toast.success('Coupon revoked')
    },
  })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const openEdit = (c: any) => {
    setEditId(c.id)
    setForm({
      promo_code: c.promo_code || '', is_default: c.is_default, enabled: c.enabled,
      discount_type: c.discount_type || 'flat', discount_value: c.discount_value || 0,
      currency: c.currency || 'USD', code_prefix: c.code_prefix || '',
      code_length: c.code_length || 8, max_codes: c.max_codes || 0,
      valid_days: c.valid_days || 0, description: c.description || '',
      delivery_method: c.delivery_method || 'api',
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(defaultForm) }

  const stats = [
    { label: 'Total codes', value: totalCodes, icon: Ticket, color: '#c084fc' },
    { label: 'Active', value: activeCodes, icon: CheckCircle2, color: '#4ade80' },
    { label: 'Redeemed', value: usedCodes, icon: Gift, color: '#facc15' },
    { label: 'Campaigns', value: campaigns.length, icon: Megaphone, color: '#818cf8' },
  ]

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Page header */}
      <div
        className="fade-in"
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 16,
          alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Coupons & Promos
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.5, maxWidth: 560 }}>
            Spin up promo campaigns and subscribers automatically receive a unique discount code when they join.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }}
        >
          <Plus size={16} /> New campaign
        </button>
      </div>

      {/* Stats */}
      <div
        className="stagger"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: 70, height: 13, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 48, height: 28, borderRadius: 8, marginTop: 12 }} />
              </div>
            ))
          : stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 500 }}>{s.label}</span>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: 9,
                      background: `${s.color}1a`, border: `1px solid ${s.color}33`,
                    }}
                  >
                    <s.icon size={15} color={s.color} />
                  </span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginTop: 10 }}>{s.value}</div>
              </div>
            ))}
      </div>

      {/* Campaigns section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="icon-tile" style={{ width: 34, height: 34, borderRadius: 10 }}>
          <Megaphone size={16} />
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Promo campaigns</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--ink-faint)' }}>
            Define the discount, the trigger code, and how it&apos;s delivered.
          </p>
        </div>
      </div>

      {/* Campaign list */}
      {isError ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 32 }}>
          <AlertCircle size={28} color="#f87171" style={{ margin: '0 auto 10px' }} />
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontWeight: 600 }}>Couldn&apos;t load campaigns</p>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-faint)', fontSize: 13 }}>Please refresh the page to try again.</p>
        </div>
      ) : isLoading ? (
        <div className="card" style={{ padding: 20, marginBottom: 32 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10, marginBottom: i < 2 ? 12 : 0 }} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card" style={{ padding: '44px 24px', textAlign: 'center', marginBottom: 32 }}>
          <span className="icon-tile" style={{ width: 52, height: 52, margin: '0 auto 14px' }}>
            <Megaphone size={22} />
          </span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>No campaigns yet</p>
          <p style={{ margin: '6px auto 18px', fontSize: 13.5, color: 'var(--ink-muted)', maxWidth: 380, lineHeight: 1.5 }}>
            Create your first promo campaign to start rewarding new subscribers with unique codes.
          </p>
          <button
            className="btn-primary"
            onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }}
          >
            <Plus size={16} /> New campaign
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Promo code</th>
                  <th>Discount</th>
                  <th>Codes issued</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Tag size={13} color="#818cf8" />
                        <code style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>
                          {c.promo_code || '(default)'}
                        </code>
                        {c.is_default && <span className="badge badge-purple">Default</span>}
                      </div>
                      {c.description && (
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>{c.description}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.currency} ${c.discount_value}`}
                    </td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{c.codes_issued}</td>
                    <td>
                      <span className={`badge ${c.enabled ? 'badge-green' : 'badge-gray'}`}>
                        {c.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          className="icon-btn"
                          aria-label="Edit campaign"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label="Delete campaign"
                          style={{ color: '#f87171' }}
                          onClick={() => setConfirmModal({
                            title: 'Delete campaign',
                            content: 'Are you sure you want to delete this campaign? This cannot be undone.',
                            onConfirm: () => { deleteMut.mutate(c.id); setConfirmModal(null) },
                          })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupon codes section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="icon-tile" style={{ width: 34, height: 34, borderRadius: 10 }}>
          <Ticket size={16} />
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Coupon codes</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--ink-faint)' }}>
            Every code issued across your campaigns.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            aria-label="Search coupon codes"
            placeholder="Search code, email, promo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select
          className="input"
          aria-label="Filter by status"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="used">Used</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
        <select
          className="input"
          aria-label="Filter by campaign"
          style={{ width: 'auto', minWidth: 140 }}
          value={campaignFilter}
          onChange={e => setCampaignFilter(e.target.value)}
        >
          <option value="">All campaigns</option>
          {campaigns.map((c: any) => (
            <option key={c.id} value={c.id}>{c.promo_code || '(default)'}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {codesLoading ? (
          <div style={{ padding: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 40, borderRadius: 10, marginBottom: i < 4 ? 12 : 0 }} />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: '52px 24px', textAlign: 'center' }}>
            <span className="icon-tile" style={{ width: 52, height: 52, margin: '0 auto 14px' }}>
              <Inbox size={22} />
            </span>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {search || statusFilter || campaignFilter ? 'No matching codes' : 'No coupon codes yet'}
            </p>
            <p style={{ margin: '6px auto 0', fontSize: 13.5, color: 'var(--ink-muted)', maxWidth: 400, lineHeight: 1.5 }}>
              {search || statusFilter || campaignFilter
                ? 'Try adjusting your search or filters.'
                : 'Create a campaign and new subscribers will get codes automatically.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Source</th>
                  <th>Subscriber</th>
                  <th>Status</th>
                  <th>Discount</th>
                  <th>Expires</th>
                  <th>Created</th>
                  <th style={{ width: 48, textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>{c.code}</code>
                        <button
                          aria-label="Copy code"
                          onClick={() => copyCode(c.code)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 2, display: 'inline-flex' }}
                        >
                          {copied === c.code ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      {c.source_code ? (
                        <code style={{ fontSize: 12, color: '#f0abfc', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: 5 }}>{c.source_code}</code>
                      ) : <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>default</span>}
                    </td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{c.subscriber?.email || '—'}</td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'used' ? 'badge-purple' : c.status === 'revoked' ? 'badge-red' : 'badge-gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.currency} ${c.discount_value}`}
                    </td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{c.expires_at ? formatDate(c.expires_at) : '∞'}</td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{formatDate(c.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {c.status === 'active' && (
                        <button
                          className="icon-btn"
                          aria-label="Revoke coupon"
                          style={{ color: '#f87171' }}
                          onClick={() => revokeMut.mutate(c.id)}
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign form modal */}
      {showForm && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }}
            onClick={closeForm}
          />
          <div
            className="card fade-in-up"
            role="dialog"
            aria-modal="true"
            aria-label={editId ? 'Edit campaign' : 'New campaign'}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(680px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
              zIndex: 1000, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                {editId ? 'Edit campaign' : 'New campaign'}
              </h3>
              <button className="icon-btn" aria-label="Close" onClick={closeForm}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="field-label" htmlFor="cp-promo">Promo code (trigger)</label>
                <input
                  id="cp-promo"
                  className="input"
                  placeholder="e.g. get5, promo6"
                  value={form.promo_code}
                  onChange={e => setForm(f => ({ ...f, promo_code: e.target.value.toLowerCase() }))}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cp-type">Discount type</label>
                <select
                  id="cp-type"
                  className="input"
                  value={form.discount_type}
                  onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
                >
                  <option value="flat">Flat amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="cp-value">
                  Value {form.discount_type === 'percent' ? '(%)' : `(${form.currency})`}
                </label>
                <input
                  id="cp-value"
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: +e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="field-label" htmlFor="cp-prefix">Code prefix</label>
                <input
                  id="cp-prefix"
                  className="input"
                  placeholder="EARLY"
                  value={form.code_prefix}
                  onChange={e => setForm(f => ({ ...f, code_prefix: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cp-length">Code length</label>
                <input
                  id="cp-length"
                  className="input"
                  type="number"
                  min={6}
                  max={16}
                  value={form.code_length}
                  onChange={e => setForm(f => ({ ...f, code_length: +e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cp-max">Max codes</label>
                <input
                  id="cp-max"
                  className="input"
                  type="number"
                  min={0}
                  value={form.max_codes}
                  onChange={e => setForm(f => ({ ...f, max_codes: +e.target.value }))}
                />
                <p className="help-text">0 = unlimited</p>
              </div>
              <div>
                <label className="field-label" htmlFor="cp-days">Valid days</label>
                <input
                  id="cp-days"
                  className="input"
                  type="number"
                  min={0}
                  value={form.valid_days}
                  onChange={e => setForm(f => ({ ...f, valid_days: +e.target.value }))}
                />
                <p className="help-text">0 = never expires</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="field-label" htmlFor="cp-currency">Currency</label>
                <input
                  id="cp-currency"
                  className="input"
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cp-delivery">Delivery method</label>
                <select
                  id="cp-delivery"
                  className="input"
                  value={form.delivery_method}
                  onChange={e => setForm(f => ({ ...f, delivery_method: e.target.value }))}
                >
                  <option value="api">API response</option>
                  <option value="email">Email only</option>
                  <option value="none">None (admin view only)</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="cp-desc">Description</label>
                <input
                  id="cp-desc"
                  className="input"
                  placeholder="Early bird 50% off"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="divider" style={{ margin: '4px 0 16px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span
                  className={`switch ${form.enabled ? 'on' : ''}`}
                  role="switch"
                  aria-checked={form.enabled}
                  onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                />
                <span>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Enabled</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Issue codes for this campaign.</span>
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span
                  className={`switch ${form.is_default ? 'on' : ''}`}
                  role="switch"
                  aria-checked={form.is_default}
                  onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
                />
                <span>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Default campaign</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Used when no promo code is provided.</span>
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => editId ? updateMut.mutate() : createMut.mutate()}
                disabled={createMut.isPending || updateMut.isPending}
              >
                {editId
                  ? (updateMut.isPending ? 'Updating...' : 'Update campaign')
                  : (createMut.isPending ? 'Creating...' : 'Create campaign')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }}
            onClick={() => setConfirmModal(null)}
          />
          <div
            className="card fade-in-up"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(420px, calc(100vw - 32px))', zIndex: 1000, padding: 24,
              boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{confirmModal.content}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmModal.onConfirm} disabled={deleteMut.isPending}>
                {deleteMut.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
