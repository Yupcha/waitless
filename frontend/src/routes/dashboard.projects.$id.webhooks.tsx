import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Globe, Trash2, Plus, Copy, ShieldCheck, AlertTriangle, X, Webhook, Link2 } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/dashboard/projects/$id/webhooks')({
  component: WebhooksPage,
})

const EVENT_OPTIONS = [
  { value: 'subscriber.created,subscriber.unsubscribed', label: 'All events' },
  { value: 'subscriber.created', label: 'Subscriber created only' },
  { value: 'subscriber.unsubscribed', label: 'Unsubscribed only' },
]

function WebhooksPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('subscriber.created,subscriber.unsubscribed')
  const [adding, setAdding] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)

  const { data: webhooks = [], isLoading, isError } = useQuery({
    queryKey: ['webhooks', id],
    queryFn: () => api.get(`/dashboard/projects/${id}/webhooks`).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => api.post(`/dashboard/projects/${id}/webhooks`, { url, events }),
    onSuccess: (res) => {
      setRevealedSecret(res.data.secret)
      queryClient.invalidateQueries({ queryKey: ['webhooks', id] })
      setUrl('')
      setAdding(false)
      toast.success('Webhook created')
    },
    onError: () => toast.error('Failed to create webhook'),
  })

  const deleteMut = useMutation({
    mutationFn: (whId: string) => api.delete(`/dashboard/projects/${id}/webhooks/${whId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', id] })
      toast.success('Webhook deleted')
    },
  })

  const list = webhooks as any[]

  return (
    <div className="fade-in" style={{ maxWidth: 920 }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="icon-tile" aria-hidden="true">
            <Webhook size={20} />
          </span>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
              Webhooks
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              Receive real-time HTTP callbacks when subscribers join or leave your waitlist.
            </p>
          </div>
        </div>
        <button
          className={adding ? 'btn-secondary' : 'btn-primary'}
          onClick={() => setAdding(!adding)}
          aria-expanded={adding}
        >
          {adding ? <X size={15} /> : <Plus size={15} />}
          {adding ? 'Cancel' : 'Add webhook'}
        </button>
      </header>

      {/* Secret reveal */}
      {revealedSecret && (
        <div
          className="card fade-in-up"
          style={{
            padding: 18,
            marginBottom: 18,
            background: 'rgba(74,222,128,0.07)',
            border: '1px solid rgba(74,222,128,0.25)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <ShieldCheck size={18} color="#4ade80" />
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#4ade80' }}>
              Copy your signing secret now — it won't be shown again.
            </p>
          </div>
          <div className="copy-box">
            <code style={{ flex: 1, color: '#a5b4fc', wordBreak: 'break-all' }}>{revealedSecret}</code>
            <button
              className="icon-btn"
              aria-label="Copy signing secret"
              onClick={() => {
                navigator.clipboard.writeText(revealedSecret)
                toast.success('Copied!')
              }}
            >
              <Copy size={15} />
            </button>
          </div>
          <p className="help-text" style={{ marginTop: 8 }}>
            Use this to verify the <code>X-Waitless-Signature</code> header on incoming requests.
          </p>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="card fade-in-up" style={{ padding: 22, marginBottom: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            New webhook endpoint
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="field-label" htmlFor="webhook-url">
                Endpoint URL
              </label>
              <input
                id="webhook-url"
                className="input"
                placeholder="https://your-server.com/webhook"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <p className="help-text">We'll send a signed POST request here for each subscribed event.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="webhook-events">
                Trigger on
              </label>
              <select
                id="webhook-events"
                className="input"
                value={events}
                onChange={e => setEvents(e.target.value)}
              >
                {EVENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !url}
            >
              <Plus size={15} />
              {createMut.isPending ? 'Creating…' : 'Create webhook'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ width: '55%', height: 13, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: '30%', height: 11, borderRadius: 6 }} />
              </div>
              <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 100 }} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <AlertTriangle size={30} color="#f87171" style={{ marginBottom: 10 }} />
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            Couldn't load webhooks
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-muted)' }}>
            Something went wrong. Please refresh and try again.
          </p>
        </div>
      ) : list.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <span
            className="icon-tile"
            style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px' }}
            aria-hidden="true"
          >
            <Globe size={26} />
          </span>
          <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
            No webhooks yet
          </p>
          <p style={{ margin: '0 auto 20px', fontSize: 14, color: 'var(--ink-muted)', maxWidth: 360, lineHeight: 1.6 }}>
            Connect an endpoint to get notified the moment a subscriber joins or leaves your waitlist.
          </p>
          {!adding && (
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={15} />
              Add your first webhook
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Events</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((wh: any) => (
                  <tr key={wh.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 280 }}>
                        <Link2 size={14} color="#9a91a8" style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            color: 'var(--ink-soft)',
                            fontSize: 13,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={wh.url}
                        >
                          {wh.url}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {wh.events.split(',').map((e: string) => (
                          <span key={e} className="badge badge-purple">
                            {e.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {wh.last_error ? (
                        <span className="badge badge-red" title={wh.last_error}>
                          Error
                        </span>
                      ) : (
                        <span className="badge badge-green">Active</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="icon-btn"
                        aria-label="Delete webhook"
                        style={{ color: '#f87171' }}
                        onClick={() => deleteMut.mutate(wh.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
