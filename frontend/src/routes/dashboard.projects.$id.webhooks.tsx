import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Globe, Trash2, Plus, Copy } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/dashboard/projects/$id/webhooks')({
  component: WebhooksPage,
})

function WebhooksPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState('subscriber.created,subscriber.unsubscribed')
  const [adding, setAdding] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)

  const { data: webhooks = [] } = useQuery({
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Webhooks</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Get notified when subscribers join or leave</p>
        </div>
        <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => setAdding(!adding)}>
          <Plus size={14} />&nbsp;Add Webhook
        </button>
      </div>

      {/* Secret reveal */}
      {revealedSecret && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#4ade80' }}>⚠️ Copy your signing secret — it won't be shown again:</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#a5b4fc' }}>
              {revealedSecret}
            </code>
            <button className="btn-secondary" style={{ padding: 8 }} onClick={() => {
              navigator.clipboard.writeText(revealedSecret)
              toast.success('Copied!')
            }}>
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="input" placeholder="https://your-server.com/webhook"
              value={url} onChange={e => setUrl(e.target.value)} />
            <select className="input" value={events} onChange={e => setEvents(e.target.value)}>
              <option value="subscriber.created,subscriber.unsubscribed">All events</option>
              <option value="subscriber.created">Subscriber created only</option>
              <option value="subscriber.unsubscribed">Unsubscribed only</option>
            </select>
            <button className="btn-primary" style={{ padding: '10px' }} onClick={() => createMut.mutate()}>
              {createMut.isPending ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {(webhooks as any[]).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
            <Globe size={32} color="#334155" style={{ marginBottom: 8 }} />
            <p>No webhooks configured</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Events</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(webhooks as any[]).map((wh: any) => (
                <tr key={wh.id}>
                  <td style={{ color: '#94a3b8', fontSize: 13, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {wh.url}
                  </td>
                  <td>
                    {wh.events.split(',').map((e: string) => (
                      <span key={e} className="badge badge-purple" style={{ marginRight: 4 }}>{e.trim()}</span>
                    ))}
                  </td>
                  <td>
                    {wh.last_error ? (
                      <span className="badge badge-red" title={wh.last_error}>Error</span>
                    ) : (
                      <span className="badge badge-green">Active</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-secondary" style={{ padding: 6, color: '#f87171' }}
                      onClick={() => deleteMut.mutate(wh.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
