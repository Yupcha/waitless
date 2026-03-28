import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Gift, Search, Ban, Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/coupons')({
  component: CouponsPage,
})

function CouponsPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['promo', id],
    queryFn: () => api.get(`/dashboard/projects/${id}/promo`).then(r => r.data),
  })

  const campaign = data?.campaign || {}
  const totalCodes = data?.total_codes || 0
  const usedCodes = data?.used_codes || 0
  const activeCodes = data?.active_codes || 0

  const [form, setForm] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Initialize form when data loads
  if (data && !form) {
    setForm({
      enabled: campaign.enabled || false,
      discount_type: campaign.discount_type || 'flat',
      discount_value: campaign.discount_value || 0,
      currency: campaign.currency || 'USD',
      code_prefix: campaign.code_prefix || '',
      code_length: campaign.code_length || 8,
      max_codes: campaign.max_codes || 0,
      valid_days: campaign.valid_days || 0,
      description: campaign.description || '',
    })
  }

  const saveMut = useMutation({
    mutationFn: () => api.put(`/dashboard/projects/${id}/promo`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promo', id] }); toast.success('Promo settings saved') },
    onError: () => toast.error('Failed to save'),
  })

  const { data: codesData } = useQuery({
    queryKey: ['coupons', id, search, statusFilter],
    queryFn: () => api.get(`/dashboard/projects/${id}/coupons`, {
      params: { search, status: statusFilter, limit: 50 },
    }).then(r => r.data),
  })
  const coupons: any[] = codesData?.coupons || []

  const revokeMut = useMutation({
    mutationFn: (cid: string) => api.patch(`/dashboard/projects/${id}/coupons/${cid}/revoke`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons', id] })
      qc.invalidateQueries({ queryKey: ['promo', id] })
      toast.success('Coupon revoked')
    },
  })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!form) return null

  return (
    <div>
      {/* Stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Codes', value: totalCodes, color: '99,102,241' },
          { label: 'Active', value: activeCodes, color: '34,197,94' },
          { label: 'Used', value: usedCodes, color: '251,191,36' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{s.label}</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Campaign config */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Gift size={15} color="#818cf8" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Promo Campaign</h3>
          <div style={{ marginLeft: 'auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.enabled}
                onChange={e => setForm((f: any) => ({ ...f, enabled: e.target.checked }))}
                style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, color: form.enabled ? '#4ade80' : '#64748b', fontWeight: 500 }}>
                {form.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Discount Type</label>
            <select className="input" value={form.discount_type}
              onChange={e => setForm((f: any) => ({ ...f, discount_type: e.target.value }))}>
              <option value="flat">Flat Amount</option>
              <option value="percent">Percentage</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>
              Discount Value {form.discount_type === 'percent' ? '(%)' : `(${form.currency})`}
            </label>
            <input className="input" type="number" step="0.01" value={form.discount_value}
              onChange={e => setForm((f: any) => ({ ...f, discount_value: +e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Code Prefix</label>
            <input className="input" placeholder="EARLY" value={form.code_prefix}
              onChange={e => setForm((f: any) => ({ ...f, code_prefix: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Code Length</label>
            <input className="input" type="number" min={6} max={16} value={form.code_length}
              onChange={e => setForm((f: any) => ({ ...f, code_length: +e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Currency</label>
            <input className="input" value={form.currency}
              onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Max Codes (0 = unlimited)</label>
            <input className="input" type="number" min={0} value={form.max_codes}
              onChange={e => setForm((f: any) => ({ ...f, max_codes: +e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Valid Days (0 = never expires)</label>
            <input className="input" type="number" min={0} value={form.valid_days}
              onChange={e => setForm((f: any) => ({ ...f, valid_days: +e.target.value }))} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Description</label>
          <input className="input" placeholder="e.g. Early bird 50% off" value={form.description}
            onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </div>

        <button className="btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Codes table */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input className="input" placeholder="Search by code or email..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="used">Used</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {coupons.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
            <Gift size={28} color="#334155" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No coupon codes yet. Enable the promo campaign and new subscribers will get codes automatically.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subscriber</th>
                  <th>Status</th>
                  <th>Discount</th>
                  <th>Expires</th>
                  <th>Created</th>
                  <th style={{ width: 50 }}></th>
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
                          {copied === c.code ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                        </button>
                      </div>
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
                    <td style={{ color: '#64748b', fontSize: 13 }}>{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(c.created_at)}</td>
                    <td>
                      {c.status === 'active' && (
                        <button onClick={() => revokeMut.mutate(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}>
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
    </div>
  )
}
