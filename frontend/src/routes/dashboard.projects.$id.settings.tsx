import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Trash2, AlertTriangle, Plus, ChevronUp, ChevronDown, X } from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/$id/settings')({
  component: ProjectSettings,
})

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{label}</label>
      {children}
    </div>
  )
}

type CustomField = {
  key: string; label: string; type: string; required: boolean;
  placeholder?: string; options?: string[];
}

function ProjectSettings() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id).then(r => r.data),
  })

  const [form, setForm] = useState({
    name: '', description: '', logo_url: '', launch_date: '',
    features: '', offer_title: '', current_price: '', discount_price: '', theme_color: '#6366f1',
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
        theme_color: project.theme_color || '#6366f1',
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
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      toast.success('Project deleted')
      navigate({ to: '/dashboard' })
    },
  })

  return (
    <div style={{ maxWidth: 600 }}>
      <form onSubmit={e => { e.preventDefault(); updateMutation.mutate() }}>
        {/* General */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>General</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Project Name">
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="Description">
              <textarea className="input" value={form.description} rows={3} style={{ resize: 'vertical' }}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>
            <Field label="Logo URL">
              <input className="input" type="url" value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
            </Field>
            <Field label="Theme Color">
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="color" value={form.theme_color}
                  onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                  style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', padding: 2, cursor: 'pointer' }} />
                <input className="input" value={form.theme_color}
                  onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))} style={{ flex: 1 }} />
              </div>
            </Field>
          </div>
        </div>

        {/* Content */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Landing Page</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Launch Date">
              <input className="input" type="date" value={form.launch_date}
                onChange={e => setForm(f => ({ ...f, launch_date: e.target.value }))} />
            </Field>
            <Field label="Headline">
              <input className="input" value={form.offer_title}
                onChange={e => setForm(f => ({ ...f, offer_title: e.target.value }))} />
            </Field>
            <Field label="Features (comma-separated)">
              <input className="input" value={form.features}
                onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Regular Price">
                <input className="input" value={form.current_price}
                  onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))} />
              </Field>
              <Field label="Launch Price">
                <input className="input" value={form.discount_price}
                  onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))} />
              </Field>
            </div>
          </div>
        </div>

        {/* Custom Form Fields Builder */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Custom Form Fields</h3>
            <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={addField}>
              <Plus size={12} /> Add Field
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px' }}>
            Add custom questions to your waitlist signup form.
          </p>

          {fields.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#334155', fontSize: 13, border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10 }}>
              No custom fields. Click "Add Field" to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.map((f, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button type="button" onClick={() => moveField(i, -1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                        <ChevronUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveField(i, 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <input className="input" placeholder="Label (e.g. Which city?)" value={f.label}
                      onChange={e => editField(i, { label: e.target.value })} style={{ flex: 1 }} />
                    <select className="input" value={f.type} style={{ width: 110 }}
                      onChange={e => editField(i, { type: e.target.value })}>
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <button type="button" onClick={() => removeField(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="input" placeholder="Key (auto)" value={f.key}
                      onChange={e => editField(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      style={{ width: 120, fontSize: 12 }} />
                    {f.type !== 'checkbox' && (
                      <input className="input" placeholder="Placeholder text" value={f.placeholder || ''}
                        onChange={e => editField(i, { placeholder: e.target.value })} style={{ flex: 1, fontSize: 12 }} />
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      <input type="checkbox" checked={f.required} onChange={e => editField(i, { required: e.target.checked })} />
                      <span style={{ fontSize: 12, color: '#64748b' }}>Required</span>
                    </label>
                  </div>
                  {f.type === 'select' && (
                    <div style={{ marginTop: 8 }}>
                      <input className="input" placeholder="Options (comma-separated)" style={{ fontSize: 12 }}
                        value={(f.options || []).join(', ')}
                        onChange={e => editField(i, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary" type="submit" style={{ padding: '12px 24px', marginBottom: 32 }}
          disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Status toggle */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Project Status</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
          Pausing hides your waitlist page from the public.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={project?.status === 'active' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => statusMutation.mutate('active')} style={{ padding: '8px 18px' }}>
            Active
          </button>
          <button className={project?.status === 'paused' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => statusMutation.mutate('paused')} style={{ padding: '8px 18px' }}>
            Paused
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ padding: 24, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, background: 'rgba(239,68,68,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={16} color="#f87171" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f87171' }}>Danger Zone</h3>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
          Permanently delete this project and all its subscribers. This cannot be undone.
        </p>
        <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { if (confirm('Delete this project and all subscribers? This cannot be undone.')) deleteMutation.mutate() }}>
          <Trash2 size={14} /> Delete Project
        </button>
      </div>
    </div>
  )
}
