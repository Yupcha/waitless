import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { projectsApi } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/projects/new')({
  component: NewProjectPage,
})

// Moved OUTSIDE the component to prevent re-creation on every render
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function NewProjectPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    launch_date: '',
    features: '',
    offer_title: '',
    current_price: '',
    discount_price: '',
    theme_color: '#6366f1',
  })

  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await projectsApi.create(form)
      toast.success('Project created!')
      navigate({ to: '/dashboard/projects/$id', params: { id: res.data.id } })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 600 }}>
      <Link to="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        color: '#64748b', textDecoration: 'none', marginBottom: 24, fontSize: 14,
      }}>
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#e2e8f0' }}>New Project</h1>
      <p style={{ margin: '0 0 32px', color: '#64748b' }}>Create a waitlist landing page for your product</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Basic Info</h3>
          <Field label="Project Name *">
            <input className="input" type="text" placeholder="My Awesome SaaS"
              value={form.name} onChange={e => handleNameChange(e.target.value)} required />
          </Field>
          <Field label="URL Slug *">
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#475569', fontSize: 14,
              }}>/w/</span>
              <input className="input" type="text" placeholder="my-awesome-saas"
                value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                style={{ paddingLeft: 40 }} required />
            </div>
          </Field>
          <Field label="Description">
            <textarea className="input" placeholder="What does your product do?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Logo URL">
            <input className="input" type="url" placeholder="https://..."
              value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
          </Field>
          <Field label="Theme Color">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="color" value={form.theme_color}
                onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                style={{ width: 48, height: 40, borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 2 }} />
              <input className="input" type="text" value={form.theme_color}
                onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                style={{ flex: 1 }} />
            </div>
          </Field>
        </div>

        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Landing Page Content</h3>
          <Field label="Launch Date">
            <input className="input" type="date" value={form.launch_date}
              onChange={e => setForm(f => ({ ...f, launch_date: e.target.value }))} />
          </Field>
          <Field label="Main Headline">
            <input className="input" type="text" placeholder="Join the waitlist for the future of X"
              value={form.offer_title} onChange={e => setForm(f => ({ ...f, offer_title: e.target.value }))} />
          </Field>
          <Field label="Features (comma-separated)">
            <input className="input" type="text" placeholder="Feature 1, Feature 2, Feature 3"
              value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Regular Price (optional)">
              <input className="input" type="text" placeholder="$99"
                value={form.current_price} onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))} />
            </Field>
            <Field label="Launch Price (optional)">
              <input className="input" type="text" placeholder="$49"
                value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))} />
            </Field>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: 16 }} disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}
