import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '@/lib/api'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Copy, Eye, EyeOff, Key, KeyRound, ShieldAlert } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/api-keys')({
  component: APIKeysPage,
})

function APIKeysPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data: keys = [], isLoading, isError } = useQuery({
    queryKey: ['api-keys', id],
    queryFn: () => apiKeysApi.list(id).then(r => r.data),
  })

  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null)
  const [keyName, setKeyName] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ title: string, content: string, onConfirm: () => void } | null>(null)

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

  const keyList = keys as any[]

  return (
    <div className="fade-in-up" style={{ maxWidth: 720 }}>
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span className="icon-tile" aria-hidden="true">
            <KeyRound size={18} />
          </span>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            API Keys
          </h2>
        </div>
        <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
          Authenticate REST API requests with secret keys. For your security, the full key is shown
          only once at creation — store it somewhere safe.
        </p>
      </header>

      {/* Create new key */}
      <section className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          Create a new key
        </h3>
        <p className="help-text" style={{ margin: '0 0 16px' }}>
          Give it a recognizable name so you can identify it later.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <label htmlFor="key-name" className="field-label" style={{ display: 'none' }}>Key name</label>
            <input
              id="key-name"
              className="input"
              placeholder="Key name (e.g. Production)"
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createMutation.mutate()}
            />
          </div>
          <button
            className="btn-primary"
            style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Plus size={15} />
            {createMutation.isPending ? 'Creating…' : 'Create key'}
          </button>
        </div>
      </section>

      {/* New key reveal (one-time) */}
      {newKey && (
        <section
          className="fade-in"
          style={{
            padding: 20,
            background: 'rgba(74,222,128,0.07)',
            border: '1px solid rgba(74,222,128,0.28)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <Key size={16} color="#4ade80" />
            <strong style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>
              {newKey.name} — copy it now, it won't be shown again
            </strong>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: 'monospace',
                color: 'var(--ink)',
                wordBreak: 'break-all',
                filter: showKey ? 'none' : 'blur(6px)',
                userSelect: showKey ? 'text' : 'none',
                transition: 'filter 0.15s ease',
              }}
            >
              {newKey.key}
            </code>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? 'Hide key' : 'Reveal key'}
              className="icon-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              type="button"
              onClick={() => copyKey(newKey.key)}
              aria-label="Copy key to clipboard"
              className="icon-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }}
            >
              <Copy size={15} />
            </button>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            Send it as a header:{' '}
            <code style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Authorization: Bearer {newKey.key.slice(0, 12)}…</code>
            {' '}or{' '}
            <code style={{ fontSize: 12, color: 'var(--ink-soft)' }}>X-API-Key: {newKey.key.slice(0, 12)}…</code>
          </p>
        </section>
      )}

      {/* Existing keys */}
      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
            Active keys
            {!isLoading && !isError && keyList.length > 0 && (
              <span className="badge badge-purple" style={{ marginLeft: 10 }}>{keyList.length}</span>
            )}
          </h3>
        </div>

        {isLoading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-sm)' }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <ShieldAlert size={28} color="#f87171" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, fontWeight: 500 }}>
              Couldn't load your API keys
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Check your connection and try again in a moment.
            </p>
          </div>
        ) : keyList.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="icon-tile" style={{ margin: '0 auto 14px' }} aria-hidden="true">
              <KeyRound size={20} />
            </span>
            <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, fontWeight: 500 }}>
              No API keys yet
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--ink-muted)', fontSize: 13 }}>
              Create your first key above to start making authenticated requests.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key prefix</th>
                  <th>Last used</th>
                  <th>Created</th>
                  <th style={{ width: 50 }} aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {keyList.map((k: any) => (
                  <tr key={k.id}>
                    <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{k.name}</td>
                    <td><code style={{ fontSize: 13, color: '#818cf8' }}>{k.prefix}…</code></td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
                      {k.last_used ? formatDate(k.last_used) : <span style={{ color: 'var(--ink-faint)' }}>Never</span>}
                    </td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{formatDate(k.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Delete key ${k.name}`}
                        onClick={() => setConfirmModal({
                          title: 'Delete API key',
                          content: 'This will permanently revoke this key. Any request using it will immediately stop working. This cannot be undone.',
                          onConfirm: () => { deleteMutation.mutate(k.id); setConfirmModal(null); },
                        })}
                        className="icon-btn"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 6 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Confirm modal */}
      {confirmModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }}
            onClick={() => setConfirmModal(null)}
          />
          <div
            className="card fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={confirmModal.title}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(420px, calc(100vw - 32px))', zIndex: 1000, padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.22)',
                  color: '#f87171', flexShrink: 0,
                }}
              >
                <ShieldAlert size={18} />
              </span>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{confirmModal.title}</h3>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              {confirmModal.content}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmModal.onConfirm} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete key'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
