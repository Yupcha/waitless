import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { projectsApi } from '@/lib/api'
import { ArrowLeft, Loader2, Rocket, Info, Sparkles, Palette, Tag, Link as LinkIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/projects/new')({
  component: NewProjectPage,
})

// Moved OUTSIDE the component to prevent re-creation on every render
function Field({
  label,
  htmlFor,
  required,
  help,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  help?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && <span style={{ color: '#ff6b9d', marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {help && <p className="help-text">{help}</p>}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
      <span className="icon-tile" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-faint)' }}>{subtitle}</p>
      </div>
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
    theme_color: '#c084fc',
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
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 48 }}>
      <Link
        to="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--ink-muted)',
          textDecoration: 'none',
          marginBottom: 24,
          fontSize: 14,
          fontWeight: 500,
          transition: 'color var(--transition-fast)',
        }}
      >
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--brand-gradient)',
            boxShadow: 'var(--shadow-glow)',
            color: '#fff',
          }}
        >
          <Rocket size={24} />
        </span>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15 }}>
            Create a new project
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.5 }}>
            Spin up a waitlist landing page for your product in seconds. You can fine-tune everything later.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basics */}
        <section className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <SectionHeader
            icon={<Sparkles size={20} />}
            title="The basics"
            subtitle="Name your project and pick its public URL"
          />

          <Field label="Project name" htmlFor="name" required help="Only you see this — it's how the project shows up in your dashboard.">
            <input
              id="name"
              className="input"
              type="text"
              placeholder="My Awesome SaaS"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              required
            />
          </Field>

          <Field label="URL slug" htmlFor="slug" required help="This becomes your public waitlist link. Letters, numbers, and dashes only.">
            <div style={{ position: 'relative' }}>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-faint)',
                  fontSize: 14,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  pointerEvents: 'none',
                }}
              >
                /w/
              </span>
              <input
                id="slug"
                className="input"
                type="text"
                placeholder="my-awesome-saas"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                style={{ paddingLeft: 40, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                required
              />
            </div>
          </Field>

          <Field label="Description" htmlFor="description" help="A short pitch for your product. Shown on the landing page.">
            <textarea
              id="description"
              className="input"
              placeholder="What does your product do?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </Field>
        </section>

        {/* Branding */}
        <section className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <SectionHeader
            icon={<Palette size={20} />}
            title="Branding"
            subtitle="Make the landing page feel like yours"
          />

          <Field label="Logo URL" htmlFor="logo_url" help="Paste a direct link to your logo image (PNG or SVG works best).">
            <div style={{ position: 'relative' }}>
              <LinkIcon
                size={16}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-faint)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="logo_url"
                className="input"
                type="url"
                placeholder="https://..."
                value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </Field>

          <Field label="Theme color" htmlFor="theme_color" help="The accent color used across your waitlist page.">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                aria-label="Pick theme color"
                type="color"
                value={form.theme_color}
                onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                style={{
                  width: 48,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  padding: 2,
                  flexShrink: 0,
                }}
              />
              <input
                id="theme_color"
                className="input"
                type="text"
                value={form.theme_color}
                onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                style={{ flex: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              />
            </div>
          </Field>
        </section>

        {/* Landing page content */}
        <section className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <SectionHeader
            icon={<Tag size={20} />}
            title="Landing page content"
            subtitle="Optional — what visitors see before they sign up"
          />

          <Field label="Launch date" htmlFor="launch_date" help="Powers the countdown on your landing page. Leave blank if undecided.">
            <input
              id="launch_date"
              className="input"
              type="date"
              value={form.launch_date}
              onChange={e => setForm(f => ({ ...f, launch_date: e.target.value }))}
            />
          </Field>

          <Field label="Main headline" htmlFor="offer_title" help="The big, bold promise at the top of your page.">
            <input
              id="offer_title"
              className="input"
              type="text"
              placeholder="Join the waitlist for the future of X"
              value={form.offer_title}
              onChange={e => setForm(f => ({ ...f, offer_title: e.target.value }))}
            />
          </Field>

          <Field label="Features" htmlFor="features" help="Separate each feature with a comma — they appear as a highlight list.">
            <input
              id="features"
              className="input"
              type="text"
              placeholder="Feature 1, Feature 2, Feature 3"
              value={form.features}
              onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <Field label="Regular price" htmlFor="current_price" help="Optional">
              <input
                id="current_price"
                className="input"
                type="text"
                placeholder="$99"
                value={form.current_price}
                onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))}
              />
            </Field>
            <Field label="Launch price" htmlFor="discount_price" help="Optional — shown as the discounted offer">
              <input
                id="discount_price"
                className="input"
                type="text"
                placeholder="$49"
                value={form.discount_price}
                onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))}
              />
            </Field>
          </div>
        </section>

        {/* Hint + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--ink-faint)',
            fontSize: 13,
            padding: '0 4px',
          }}
        >
          <Info size={15} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>Everything except name and slug is optional and fully editable after you create the project.</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Creating…
              </>
            ) : (
              <>
                <Rocket size={16} />
                Create project
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
