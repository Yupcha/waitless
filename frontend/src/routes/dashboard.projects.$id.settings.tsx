import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Trash2, AlertTriangle } from 'lucide-react'

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
  })

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
      })
    }
  }, [project])

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
