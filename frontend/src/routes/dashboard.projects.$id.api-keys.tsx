import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '@/lib/api'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Copy, Eye, EyeOff, Key } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/api-keys')({
  component: APIKeysPage,
})

function APIKeysPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data: keys = [] } = useQuery({
    queryKey: ['api-keys', id],
    queryFn: () => apiKeysApi.list(id).then(r => r.data),
  })

  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null)
  const [keyName, setKeyName] = useState('')
  const [showKey, setShowKey] = useState(false)

  const createMutation = useMutation({
    mutationFn: () => apiKeysApi.create(id, keyName || 'Default'),
    onSuccess: (res) => {
      setNewKey(res.data)
      setKeyName('')
      qc.invalidateQueries({ queryKey: ['api-keys', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => apiKeysApi.delete(id, keyId),
    onSuccess: () => {
      toast.success('Key deleted')
      qc.invalidateQueries({ queryKey: ['api-keys', id] })
    },
  })

  const copyKey = (k: string) => {
    navigator.clipboard.writeText(k)
    toast.success('Copied to clipboard')
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>API Keys</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Use API keys to authenticate REST API requests. Keys are shown only once — save them securely.
        </p>
      </div>

      {/* Create new key */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Create New Key</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="input" placeholder="Key name (e.g. Production)"
            value={keyName} onChange={e => setKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createMutation.mutate()} />
          <button className="btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus size={14} /> Create Key
          </button>
        </div>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div style={{
          padding: 20, background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Key size={16} color="#4ade80" />
            <strong style={{ color: '#4ade80', fontSize: 14 }}>
              Save this key — it won't be shown again
            </strong>
          </div>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px',
          }}>
            <code style={{
              flex: 1, fontSize: 13, fontFamily: 'monospace', color: '#e2e8f0',
              wordBreak: 'break-all',
              filter: showKey ? 'none' : 'blur(6px)',
              userSelect: showKey ? 'text' : 'none',
            }}>
              {newKey.key}
            </code>
            <button onClick={() => setShowKey(!showKey)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button onClick={() => copyKey(newKey.key)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
              <Copy size={15} />
            </button>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#64748b' }}>
            Use with: <code style={{ fontSize: 12 }}>Authorization: Bearer {newKey.key.slice(0, 12)}...</code>
            {' '} or <code style={{ fontSize: 12 }}>X-API-Key: {newKey.key.slice(0, 12)}...</code>
          </p>
        </div>
      )}

      {/* Existing keys */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {(keys as any[]).length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No API keys yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key Prefix</th>
                <th>Last Used</th>
                <th>Created</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {(keys as any[]).map((k: any) => (
                <tr key={k.id}>
                  <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{k.name}</td>
                  <td><code style={{ fontSize: 13, color: '#818cf8' }}>{k.prefix}...</code></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{k.last_used ? formatDate(k.last_used) : 'Never'}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(k.created_at)}</td>
                  <td>
                    <button onClick={() => { if (confirm('Delete this API key?')) deleteMutation.mutate(k.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
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
