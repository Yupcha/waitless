import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Trash2, AlertTriangle, Plus, ChevronUp, ChevronDown, X, RefreshCw, Lock,
  Settings2, Sparkles, ListPlus, Power, GripVertical,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/$id/settings')({
  component: ProjectSettings,
})

type CustomField = {
  key: string; label: string; type: string; required: boolean;
  placeholder?: string; options?: string[];
}

function SectionCard({
  icon, title, subtitle, action, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: subtitle ? 4 : 18 }}>
        <span
          className="icon-tile"
          style={{ width: 38, height: 38, flexShrink: 0, color: '#d8b4fe' }}
        >
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{title}</h3>
          {subtitle && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-faint)', lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div style={{ marginTop: subtitle ? 18 : 0 }}>{children}</div>
    </section>
  )
}

function ProjectSettings() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id).then(r => r.data),
  })

  const [deleteModal, setDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const [form, setForm] = useState({
    name: '', description: '', logo_url: '', launch_date: '',
    features: '', offer_title: '', current_price: '', discount_price: '', theme_color: '#c084fc',
    custom_fields: '[]',
  })

  const [fields, setFields] = useState<CustomField[]>([])

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        logo_url: project.logo_url || '',
        launch_date: project.launch_date ? project.launch_date.slice(0, 10) : '',
        features: project.features || '',
        offer_title: project.offer_title || '',
        current_price: project.current_price || '',
        discount_price: project.discount_price || '',
        theme_color: project.theme_color || '#c084fc',
        custom_fields: project.custom_fields || '[]',
      })
      try {
        setFields(JSON.parse(project.custom_fields || '[]'))
      } catch { setFields([]) }
    }
  }, [project])

  // Sync fields to form
  const updateFields = (newFields: CustomField[]) => {
    setFields(newFields)
    setForm(f => ({ ...f, custom_fields: JSON.stringify(newFields) }))
  }

  const addField = () => {
    updateFields([...fields, { key: '', label: '', type: 'text', required: false, placeholder: '', options: [] }])
  }

  const removeField = (i: number) => {
    updateFields(fields.filter((_, idx) => idx !== i))
  }

  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const arr = [...fields]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    updateFields(arr)
  }

  const editField = (i: number, patch: Partial<CustomField>) => {
    const arr = [...fields]
    arr[i] = { ...arr[i], ...patch }
    // Auto-generate key from label
    if (patch.label !== undefined && !arr[i].key) {
      arr[i].key = patch.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    }
    updateFields(arr)
  }

  const updateMutation = useMutation({
    mutationFn: () => projectsApi.update(id, form),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['project', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => projectsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Status updated')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (password: string) => projectsApi.delete(id, password),
    onSuccess: () => {
      toast.success('Project marked for deletion')
      qc.invalidateQueries({ queryKey: ['project', id] })
      setDeleteModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete'),
  })

  const recoverMutation = useMutation({
    mutationFn: () => projectsApi.recover(id),
    onSuccess: () => {
      toast.success('Project recovered completely!')
      qc.invalidateQueries({ queryKey: ['project', id] })
    },
    onError: () => toast.error('Failed to recover project'),
  })

  // ── Loading state ──
  if (isLoading) {
    return (
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 32, width: 220, borderRadius: 10 }} />
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: i === 2 ? 220 : 260, borderRadius: 18 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720 }} className="fade-in">
      {/* Page header */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Project settings
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)' }}>
          Manage branding, landing page content, and lifecycle for this waitlist.
        </p>
      </header>

      <form
        onSubmit={e => { e.preventDefault(); updateMutation.mutate() }}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        className="stagger"
      >
        {/* General */}
        <SectionCard icon={<Settings2 size={18} />} title="General">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="set-name" className="field-label">Project name</label>
              <input id="set-name" className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="set-desc" className="field-label">Description</label>
              <textarea id="set-desc" className="input" value={form.description} rows={3} style={{ resize: 'vertical' }}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <p className="help-text">A short summary shown alongside your waitlist.</p>
            </div>
            <div>
              <label htmlFor="set-logo" className="field-label">Logo URL</label>
              <input id="set-logo" className="input" type="url" value={form.logo_url}
                placeholder="https://yoursite.com/logo.png"
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="set-theme" className="field-label">Theme color</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="color" aria-label="Pick theme color" value={form.theme_color}
                  onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                  style={{ width: 48, height: 44, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'none', padding: 2, cursor: 'pointer' }} />
                <input id="set-theme" className="input" value={form.theme_color}
                  onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))} style={{ flex: 1 }} />
              </div>
              <p className="help-text">Accent color used across your public waitlist page.</p>
            </div>
          </div>
        </SectionCard>

        {/* Content */}
        <SectionCard icon={<Sparkles size={18} />} title="Landing page" subtitle="The story visitors see before they sign up.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="set-launch" className="field-label">Launch date</label>
              <input id="set-launch" className="input" type="date" value={form.launch_date}
                onChange={e => setForm(f => ({ ...f, launch_date: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="set-headline" className="field-label">Headline</label>
              <input id="set-headline" className="input" value={form.offer_title}
                placeholder="Be the first to try it"
                onChange={e => setForm(f => ({ ...f, offer_title: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="set-features" className="field-label">Features</label>
              <input id="set-features" className="input" value={form.features}
                placeholder="Fast, Private, Open source"
                onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
              <p className="help-text">Comma-separated list of highlights.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <label htmlFor="set-price" className="field-label">Regular price</label>
                <input id="set-price" className="input" value={form.current_price}
                  onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="set-discount" className="field-label">Launch price</label>
                <input id="set-discount" className="input" value={form.discount_price}
                  onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Custom Form Fields Builder */}
        <SectionCard
          icon={<ListPlus size={18} />}
          title="Custom form fields"
          subtitle="Add your own questions to the waitlist signup form."
          action={
            <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}
              onClick={addField}>
              <Plus size={14} /> Add field
            </button>
          }
        >
          {fields.length === 0 ? (
            <div style={{
              padding: '32px 24px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13,
              border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
            }}>
              <ListPlus size={22} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
              No custom fields yet. Add one to collect more from your subscribers.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.map((f, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--ink-faint)' }}>
                      <button type="button" aria-label="Move field up" onClick={() => moveField(i, -1)} disabled={i === 0}
                        style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: 'inherit', padding: 0, opacity: i === 0 ? 0.3 : 1 }}>
                        <ChevronUp size={14} />
                      </button>
                      <GripVertical size={12} style={{ opacity: 0.4, margin: '1px 1px' }} />
                      <button type="button" aria-label="Move field down" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}
                        style={{ background: 'none', border: 'none', cursor: i === fields.length - 1 ? 'default' : 'pointer', color: 'inherit', padding: 0, opacity: i === fields.length - 1 ? 0.3 : 1 }}>
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <input className="input" placeholder="Label (e.g. Which city?)" value={f.label}
                      onChange={e => editField(i, { label: e.target.value })} style={{ flex: 1, minWidth: 0 }} />
                    <select className="input" value={f.type} style={{ width: 120, flexShrink: 0 }}
                      aria-label="Field type"
                      onChange={e => editField(i, { type: e.target.value })}>
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <button type="button" aria-label="Remove field" onClick={() => removeField(i)}
                      className="icon-btn"
                      style={{ color: '#f87171', flexShrink: 0 }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="input" placeholder="Key (auto)" value={f.key}
                      onChange={e => editField(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      style={{ width: 130, fontSize: 12 }} />
                    {f.type !== 'checkbox' && (
                      <input className="input" placeholder="Placeholder text" value={f.placeholder || ''}
                        onChange={e => editField(i, { placeholder: e.target.value })} style={{ flex: 1, minWidth: 140, fontSize: 12 }} />
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'pointer', marginLeft: 'auto' }}>
                      <span className={`switch${f.required ? ' on' : ''}`}
                        role="switch" aria-checked={f.required} aria-label="Required field"
                        onClick={() => editField(i, { required: !f.required })} />
                      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Required</span>
                    </label>
                  </div>
                  {f.type === 'select' && (
                    <div style={{ marginTop: 10 }}>
                      <input className="input" placeholder="Options (comma-separated)" style={{ fontSize: 12 }}
                        value={(f.options || []).join(', ')}
                        onChange={e => editField(i, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div>
          <button className="btn-primary" type="submit" style={{ padding: '12px 26px' }}
            disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>

      <hr className="divider" />

      {/* Status toggle */}
      <SectionCard
        icon={<Power size={18} />}
        title="Project status"
        subtitle="Pausing hides your public waitlist page from new visitors."
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className={project?.status === 'active' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => statusMutation.mutate('active')} disabled={statusMutation.isPending}
            style={{ padding: '9px 20px' }}>
            Active
          </button>
          <button type="button" className={project?.status === 'paused' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => statusMutation.mutate('paused')} disabled={statusMutation.isPending}
            style={{ padding: '9px 20px' }}>
            Paused
          </button>
        </div>
      </SectionCard>

      <div style={{ height: 20 }} />

      {/* Danger zone / Recovery zone */}
      {project?.status === 'pending_deletion' ? (
        <section style={{ padding: 24, border: '1px solid rgba(74,222,128,0.28)', borderRadius: 'var(--radius-lg)', background: 'rgba(74,222,128,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <RefreshCw size={17} color="#4ade80" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#4ade80' }}>Recovery available</h3>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
            This project is scheduled for permanent deletion on{' '}
            <strong style={{ color: 'var(--ink-soft)' }}>{new Date(project.scheduled_deletion_at).toLocaleDateString()}</strong>.
            You can restore it to full functionality right now.
          </p>
          <button type="button" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4ade80', color: '#0e0c12' }}
            onClick={() => recoverMutation.mutate()} disabled={recoverMutation.isPending}>
            <RefreshCw size={15} /> {recoverMutation.isPending ? 'Restoring…' : 'Restore project'}
          </button>
        </section>
      ) : (
        <section style={{ padding: 24, border: '1px solid rgba(248,113,113,0.28)', borderRadius: 'var(--radius-lg)', background: 'rgba(248,113,113,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={17} color="#f87171" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f87171' }}>Danger zone</h3>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
            Schedule this project and all of its subscribers for deletion. It stays recoverable for 14 days before being permanently destroyed.
          </p>
          <button type="button" className="btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={() => { setDeleteModal(true); setDeletePassword(''); }}>
            <Trash2 size={15} /> Delete project
          </button>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div role="dialog" aria-modal="true" aria-label="Confirm project deletion">
          <div
            onClick={() => setDeleteModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 999, backdropFilter: 'blur(4px)' }}
          />
          <div className="card fade-in-up" style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(420px, calc(100vw - 32px))', zIndex: 1000, padding: 26, boxShadow: '0 24px 50px rgba(0,0,0,0.55)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="icon-tile" style={{ width: 36, height: 36, color: '#f87171', background: 'rgba(248,113,113,0.12)' }}>
                <AlertTriangle size={17} />
              </span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Confirm deletion</h3>
            </div>
            <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              Enter your account password to schedule this project for deletion. This can be undone within the recovery window.
            </p>
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="del-pw" className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} /> Account password
              </label>
              <input id="del-pw" type="password" placeholder="••••••••" style={{ width: '100%' }} className="input"
                autoFocus
                value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={() => setDeleteModal(false)} style={{ padding: '9px 18px' }}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => deleteMutation.mutate(deletePassword)}
                disabled={!deletePassword || deleteMutation.isPending} style={{ padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={15} /> {deleteMutation.isPending ? 'Deleting…' : 'Secure delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
