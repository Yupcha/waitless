import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Gift, Search, Ban, Copy, Check, Plus, Pencil, Trash2, Tag } from 'lucide-react'
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

  const defaultForm = {
    promo_code: '', is_default: false, enabled: true,
    discount_type: 'flat', discount_value: 0, currency: 'USD',
    code_prefix: '', code_length: 8, max_codes: 0, valid_days: 0, description: '',
  }
  const [form, setForm] = useState(defaultForm)

  const { data } = useQuery({
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

  const { data: codesData } = useQuery({
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
    })
    setShowForm(true)
  }

  return (
    <div>
      {/* Stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Codes', value: totalCodes, color: '99,102,241' },
          { label: 'Active', value: activeCodes, color: '34,197,94' },
          { label: 'Used', value: usedCodes, color: '251,191,36' },
          { label: 'Campaigns', value: campaigns.length, color: '168,85,247' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{s.label}</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Campaigns */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Gift size={15} color="#818cf8" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Promo Campaigns</h3>
        </div>
        <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}
          onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }}>
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Campaign form modal */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
            {editId ? 'Edit Campaign' : 'New Campaign'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Promo Code (trigger)</label>
              <input className="input" placeholder="e.g. get5, promo6" value={form.promo_code}
                onChange={e => setForm(f => ({ ...f, promo_code: e.target.value.toLowerCase() }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Discount Type</label>
              <select className="input" value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="flat">Flat Amount</option>
                <option value="percent">Percentage</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Value {form.discount_type === 'percent' ? '(%)' : `(${form.currency})`}
              </label>
              <input className="input" type="number" step="0.01" value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: +e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Code Prefix</label>
              <input className="input" placeholder="EARLY" value={form.code_prefix}
                onChange={e => setForm(f => ({ ...f, code_prefix: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Code Length</label>
              <input className="input" type="number" min={6} max={16} value={form.code_length}
                onChange={e => setForm(f => ({ ...f, code_length: +e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Max Codes (0=∞)</label>
              <input className="input" type="number" min={0} value={form.max_codes}
                onChange={e => setForm(f => ({ ...f, max_codes: +e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Valid Days (0=∞)</label>
              <input className="input" type="number" min={0} value={form.valid_days}
                onChange={e => setForm(f => ({ ...f, valid_days: +e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Currency</label>
              <input className="input" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Description</label>
              <input className="input" placeholder="Early bird 50% off" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Enabled</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_default}
                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Default (used when no promo code)</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}
              onClick={() => editId ? updateMut.mutate() : createMut.mutate()}
              disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Update' : 'Create'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: 13 }}
              onClick={() => { setShowForm(false); setEditId(null); setForm(defaultForm) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 28 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Promo Code</th>
                <th>Discount</th>
                <th>Codes Issued</th>
                <th>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag size={12} color="#818cf8" />
                      <code style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>
                        {c.promo_code || '(default)'}
                      </code>
                      {c.is_default && (
                        <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>DEFAULT</span>
                      )}
                    </div>
                    {c.description && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{c.description}</div>}
                  </td>
                  <td style={{ color: '#e2e8f0', fontSize: 13 }}>
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.currency} ${c.discount_value}`}
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: 13 }}>{c.codes_issued}</td>
                  <td>
                    <span className={`badge ${c.enabled ? 'badge-green' : 'badge-gray'}`}>
                      {c.enabled ? 'active' : 'disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this campaign?')) deleteMut.mutate(c.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupon codes */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>Coupon Codes</h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input className="input" placeholder="Search code, email, promo..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="used">Used</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={campaignFilter}
          onChange={e => setCampaignFilter(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map((c: any) => (
            <option key={c.id} value={c.id}>{c.promo_code || '(default)'}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {coupons.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
            <Gift size={28} color="#334155" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No coupon codes yet. Create a campaign and new subscribers will get codes automatically.</p>
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
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>{c.code}</code>
                        <button onClick={() => copyCode(c.code)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                          {copied === c.code ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      {c.source_code ? (
                        <code style={{ fontSize: 12, color: '#a78bfa', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: 4 }}>{c.source_code}</code>
                      ) : <span style={{ color: '#475569', fontSize: 12 }}>default</span>}
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>{c.subscriber?.email || '—'}</td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'used' ? 'badge-purple' : c.status === 'revoked' ? 'badge-red' : 'badge-gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: '#e2e8f0', fontSize: 13 }}>
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.currency} ${c.discount_value}`}
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{c.expires_at ? formatDate(c.expires_at) : '∞'}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(c.created_at)}</td>
                    <td>
                      {c.status === 'active' && (
                        <button onClick={() => revokeMut.mutate(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}>
                          <Ban size={13} />
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
    </div>
  )
}
