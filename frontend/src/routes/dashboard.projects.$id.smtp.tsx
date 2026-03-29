import { createFileRoute, useLocation } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { smtpApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, Send, Mail, Zap, X, ExternalLink } from 'lucide-react'

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

const PROVIDERS = [
  { id: 'smtp', label: 'Manual SMTP', icon: '⚙️', description: 'Configure any SMTP server with host, port & password' },
  { id: 'gmail_oauth', label: 'Gmail (OAuth)', icon: '📧', description: 'Connect your Gmail account securely — no password needed' },
  { id: 'zoho_oauth', label: 'Zoho Mail (OAuth)', icon: '🔷', description: 'Connect your Zoho Mail account via OAuth2' },
]

const SMTP_PRESETS = [
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, tls: true, note: 'Requires App Password or use OAuth above' },
  { name: 'Zoho Mail', host: 'smtp.zoho.com', port: 587, tls: true, note: 'Use OAuth above or Zoho App Password' },
  { name: 'Outlook / Hotmail', host: 'smtp-mail.outlook.com', port: 587, tls: true, note: '' },
  { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, tls: true, note: '' },
  { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, tls: true, note: '' },
  { name: 'Amazon SES (US East)', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, tls: true, note: '' },
  { name: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: 587, tls: true, note: '' },
  { name: 'Postmark', host: 'smtp.postmarkapp.com', port: 587, tls: true, note: '' },
]

function SMTPPage() {
  const { id } = Route.useParams()
  const location = useLocation()
  const qc = useQueryClient()

  // Check for OAuth success redirect from Google/Zoho
  useEffect(() => {
    const search = new URLSearchParams(location.search)
    const oauthResult = search.get('oauth')
    if (oauthResult === 'gmail_success') toast.success('✅ Gmail connected via OAuth!')
    if (oauthResult === 'zoho_success') toast.success('✅ Zoho Mail connected via OAuth!')
    if (oauthResult === 'zoho_need_email') toast.success('Zoho connected! Please enter your Zoho email below.')
  }, [location.search])

  const { data: smtp } = useQuery({
    queryKey: ['smtp', id],
    queryFn: () => smtpApi.get(id).then(r => r.data),
  })

  const activeProvider: string = smtp?.provider || 'smtp'
  const [selectedProvider, setSelectedProvider] = useState<string>(activeProvider)

  useEffect(() => {
    if (smtp?.provider) setSelectedProvider(smtp.provider)
  }, [smtp?.provider])

  const [form, setForm] = useState({
    host: '', port: 587, username: '', password: '',
    from_email: '', from_name: '', tls: true,
  })

  useEffect(() => {
    if (smtp) setForm(f => ({ ...f, ...smtp, password: '' }))
  }, [smtp])

  const saveMutation = useMutation({
    mutationFn: () => smtpApi.save(id, { ...form, provider: selectedProvider }),
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

  const oauthConnectMutation = useMutation({
    mutationFn: async (provider: 'gmail' | 'zoho') => {
      const res = provider === 'gmail'
        ? await smtpApi.gmailConnect(id)
        : await smtpApi.zohoConnect(id)
      return res.data
    },
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to initiate OAuth'),
  })

  const [zohoManualCode, setZohoManualCode] = useState('')
  const [zohoManualEmail, setZohoManualEmail] = useState('')
  const [zohoMode, setZohoMode] = useState<'redirect' | 'manual'>('manual')

  const zohoExchangeMutation = useMutation({
    mutationFn: () => smtpApi.zohoExchange(id, zohoManualCode, zohoManualEmail),
    onSuccess: () => {
      toast.success('✅ Zoho Mail connected!')
      setZohoManualCode('')
      qc.invalidateQueries({ queryKey: ['smtp', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to exchange code'),
  })

  const oauthDisconnectMutation = useMutation({
    mutationFn: (provider: 'gmail' | 'zoho') =>
      provider === 'gmail' ? smtpApi.gmailDisconnect(id) : smtpApi.zohoDisconnect(id),
    onSuccess: () => {
      toast.success('Account disconnected')
      qc.invalidateQueries({ queryKey: ['smtp', id] })
    },
  })

  const isOAuth = selectedProvider === 'gmail_oauth' || selectedProvider === 'zoho_oauth'
  const isConnected = isOAuth && smtp?.oauth_email && smtp?.provider === selectedProvider
  const isOAuthNeedEmail = isOAuth && smtp?.provider === selectedProvider && !smtp?.oauth_email

  const [zohoEmailInput, setZohoEmailInput] = useState('')
  const zohoSetEmailMutation = useMutation({
    mutationFn: () => smtpApi.zohoSetEmail(id, zohoEmailInput),
    onSuccess: () => {
      toast.success('✅ Zoho email set!')
      qc.invalidateQueries({ queryKey: ['smtp', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to set email'),
  })

  return (
    <div style={{ maxWidth: 580 }}>

      {/* Verified banner */}
      {smtp?.verified && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 10, marginBottom: 24, color: '#4ade80', fontSize: 14,
        }}>
          <CheckCircle size={16} /> Email delivery verified and working
        </div>
      )}

      {/* Provider Selector */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
          Email Provider
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                background: selectedProvider === p.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                border: selectedProvider === p.id
                  ? '1px solid rgba(99,102,241,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14, marginBottom: 2 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.description}</div>
              </div>
              {selectedProvider === p.id && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
              )}
              {/* Show connected badge */}
              {smtp?.provider === p.id && smtp?.verified && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px',
                  background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                  borderRadius: 6, whiteSpace: 'nowrap',
                }}>Connected</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OAuth flow UI */}
      {isOAuth && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          {isConnected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle size={20} color="#4ade80" />
                <div>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>Connected Account</div>
                  <div style={{ fontSize: 13, color: '#4ade80', marginTop: 2 }}>{smtp?.oauth_email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                  <Send size={13} /> {testMutation.isPending ? 'Sending...' : 'Send Test Email'}
                </button>
                <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
                  onClick={() => oauthDisconnectMutation.mutate(selectedProvider === 'gmail_oauth' ? 'gmail' : 'zoho')}
                  disabled={oauthDisconnectMutation.isPending}>
                  <X size={13} /> Disconnect
                </button>
              </div>
            </>
          ) : isOAuthNeedEmail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={20} color="#fbbf24" />
                <div>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>OAuth Connected</div>
                  <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 2 }}>Please enter your Zoho email to complete setup</div>
                </div>
              </div>
              <Field label="Your Zoho Email" hint="The email address you use with Zoho Mail">
                <input className="input" placeholder="you@zohomail.com"
                  value={zohoEmailInput} onChange={e => setZohoEmailInput(e.target.value)} />
              </Field>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary"
                  onClick={() => zohoSetEmailMutation.mutate()}
                  disabled={!zohoEmailInput || zohoSetEmailMutation.isPending}>
                  {zohoSetEmailMutation.isPending ? 'Saving...' : 'Set Email & Verify'}
                </button>
                <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
                  onClick={() => oauthDisconnectMutation.mutate('zoho')}
                  disabled={oauthDisconnectMutation.isPending}>
                  <X size={13} /> Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 0 4px' }}>
              <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>🔷</div>
              <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#e2e8f0', textAlign: 'center' }}>Connect Zoho Mail</h4>

              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                {(['manual', 'redirect'] as const).map(m => (
                  <button key={m} onClick={() => setZohoMode(m)} style={{
                    flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: zohoMode === m ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: zohoMode === m ? '#818cf8' : '#64748b', transition: 'all 0.15s',
                  }}>
                    {m === 'manual' ? '📋 Paste Auth Code (Self Client)' : '🔗 Redirect OAuth (Server App)'}
                  </button>
                ))}
              </div>

              {zohoMode === 'manual' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, fontSize: 12, color: '#fbbf24', lineHeight: 1.6 }}>
                    <strong>Self Client setup:</strong><br />
                    1. Go to <a href="https://api-console.zoho.com" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>api-console.zoho.com</a> → Self Client<br />
                    2. Enter scope: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 3 }}>ZohoMail.messages.CREATE,ZohoMail.accounts.READ</code><br />
                    3. Set duration to <strong>10 minutes</strong>, generate the code<br />
                    4. Paste it below immediately
                  </div>
                  <Field label="Authorization Code">
                    <input className="input" placeholder="Paste your Zoho Self Client authorization code"
                      value={zohoManualCode} onChange={e => setZohoManualCode(e.target.value)} />
                  </Field>
                  <Field label="Your Zoho Email" hint="e.g. you@zoho.com — used as the sender address">
                    <input className="input" placeholder="you@zohomail.com"
                      value={zohoManualEmail} onChange={e => setZohoManualEmail(e.target.value)} />
                  </Field>
                  <button className="btn-primary" style={{ alignSelf: 'flex-start' }}
                    onClick={() => zohoExchangeMutation.mutate()}
                    disabled={!zohoManualCode || !zohoManualEmail || zohoExchangeMutation.isPending}>
                    {zohoExchangeMutation.isPending ? 'Connecting...' : 'Connect Zoho Mail'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                    Use this if you have a <strong>Server-based Application</strong> client in Zoho API Console<br />
                    with redirect URI: <code style={{ fontSize: 11 }}>{window.location.origin}/api/oauth/zoho/callback</code>
                  </p>
                  <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    onClick={() => oauthConnectMutation.mutate('zoho')}
                    disabled={oauthConnectMutation.isPending}>
                    <ExternalLink size={14} />
                    {oauthConnectMutation.isPending ? 'Redirecting...' : 'Connect via Redirect'}
                  </button>
                </div>
              )}

              <p style={{ margin: '14px 0 0', fontSize: 11, color: '#475569', textAlign: 'center' }}>
                Requires <code>ZOHO_CLIENT_ID</code> and <code>ZOHO_CLIENT_SECRET</code> in your <code>.env</code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual SMTP config */}
      {selectedProvider === 'smtp' && (
        <>
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={16} color="#818cf8" /> SMTP Configuration
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

              <Field label="Password" hint={smtp ? 'Leave empty to keep existing password' : undefined}>
                <input className="input" type="password" placeholder={smtp ? '••••••••' : 'Enter password'}
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

          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            <button className="btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !smtp}>
              <Send size={14} /> {testMutation.isPending ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

          {/* Quick presets */}
          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="#fbbf24" /> Quick Presets
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#475569' }}>Click to autofill host & port</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SMTP_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => setForm(f => ({ ...f, host: p.host, port: p.port, tls: p.tls }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#6366f1', fontFamily: 'monospace', marginTop: 2 }}>
                    {p.host}:{p.port}
                  </span>
                  {p.note && (
                    <span style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{p.note}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
