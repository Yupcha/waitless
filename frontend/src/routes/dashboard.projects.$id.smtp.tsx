import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { smtpApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, Send } from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/$id/smtp')({
  component: SMTPPage,
})

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>{hint}</p>}
    </div>
  )
}

function SMTPPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data: smtp } = useQuery({
    queryKey: ['smtp', id],
    queryFn: () => smtpApi.get(id).then(r => r.data),
  })

  const [form, setForm] = useState({
    host: '', port: 587, username: '', password: '',
    from_email: '', from_name: '', tls: true,
  })

  useEffect(() => {
    if (smtp) setForm(f => ({ ...f, ...smtp, password: '' }))
  }, [smtp])

  const saveMutation = useMutation({
    mutationFn: () => smtpApi.save(id, form),
    onSuccess: () => {
      toast.success('SMTP settings saved')
      qc.invalidateQueries({ queryKey: ['smtp', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save'),
  })

  const testMutation = useMutation({
    mutationFn: () => smtpApi.test(id),
    onSuccess: () => toast.success('Test email sent successfully! ✨'),
    onError: (err: any) => toast.error(err.response?.data?.error || 'SMTP test failed'),
  })

  return (
    <div style={{ maxWidth: 560 }}>
      {smtp?.verified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, marginBottom: 24, color: '#4ade80', fontSize: 14,
        }}>
          <CheckCircle size={16} /> SMTP verified and working
        </div>
      )}

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
          SMTP Configuration
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <Field label="SMTP Host">
              <input className="input" placeholder="smtp.gmail.com" value={form.host}
                onChange={e => setForm(f => ({ ...f, host: e.target.value }))} />
            </Field>
            <Field label="Port">
              <input className="input" type="number" placeholder="587" value={form.port}
                onChange={e => setForm(f => ({ ...f, port: +e.target.value }))}
                style={{ width: 90 }} />
            </Field>
          </div>

          <Field label="Username / Email">
            <input className="input" placeholder="user@example.com" value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </Field>

          <Field label="Password" hint={smtp ? "Leave empty to keep existing password" : undefined}>
            <input className="input" type="password" placeholder={smtp ? "••••••••" : "Enter password"}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="From Email">
              <input className="input" placeholder="noreply@example.com" value={form.from_email}
                onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))} />
            </Field>
            <Field label="From Name">
              <input className="input" placeholder="My Product" value={form.from_name}
                onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))} />
            </Field>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="tls" checked={form.tls}
              onChange={e => setForm(f => ({ ...f, tls: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="tls" style={{ fontSize: 14, color: '#94a3b8', cursor: 'pointer' }}>
              Enable TLS/STARTTLS
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-primary" onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !smtp}>
          <Send size={14} /> {testMutation.isPending ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>

      {/* Common configs */}
      <div className="card" style={{ padding: 24, marginTop: 28 }}>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
          Common SMTP Configurations
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {smtpPresets.map(p => (
            <button key={p.name} onClick={() => setForm(f => ({ ...f, host: p.host, port: p.port }))}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                cursor: 'pointer', color: '#94a3b8', fontSize: 13,
              }}>
              <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{p.name}</span>
              <span>{p.host}:{p.port}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const smtpPresets = [
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587 },
  { name: 'Outlook / Hotmail', host: 'smtp-mail.outlook.com', port: 587 },
  { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587 },
  { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587 },
  { name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587 },
  { name: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: 587 },
]
