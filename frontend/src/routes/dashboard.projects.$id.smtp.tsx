import { createFileRoute, useLocation } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { smtpApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  Send,
  Mail,
  Zap,
  X,
  ExternalLink,
  Settings2,
  ShieldCheck,
  Clipboard,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/smtp')({
  component: SMTPPage,
})

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="help-text">{hint}</p>}
    </div>
  )
}

const PROVIDERS = [
  {
    id: 'smtp',
    label: 'Manual SMTP',
    icon: Settings2,
    description: 'Connect any SMTP server with host, port and password.',
  },
  {
    id: 'gmail_oauth',
    label: 'Gmail',
    icon: Mail,
    description: 'Securely connect your Gmail account with OAuth — no password needed.',
  },
  {
    id: 'zoho_oauth',
    label: 'Zoho Mail',
    icon: Mail,
    description: 'Connect your Zoho Mail account via OAuth2.',
  },
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

  const { data: smtp, isLoading } = useQuery({
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
    <div className="fade-in" style={{ maxWidth: 640 }}>
      {/* Page header */}
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
          }}
        >
          Email delivery
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          Choose how Waitless sends emails for this project — connect an account or configure your own SMTP server.
        </p>
      </header>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ height: 220, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 320, borderRadius: 18 }} />
        </div>
      ) : (
        <>
          {/* Verified banner */}
          {smtp?.verified && (
            <div
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 20,
                color: '#4ade80',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <ShieldCheck size={17} /> Email delivery is verified and working.
            </div>
          )}

          {/* Provider Selector */}
          <section className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2
              style={{
                margin: '0 0 4px',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Email provider
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-muted)' }}>
              Pick the source emails will be sent from.
            </p>
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PROVIDERS.map(p => {
                const Icon = p.icon
                const active = selectedProvider === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedProvider(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      background: active ? 'rgba(192,132,252,0.12)' : 'rgba(255,255,255,0.02)',
                      border: active
                        ? '1px solid rgba(192,132,252,0.4)'
                        : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span
                      className="icon-tile"
                      style={{
                        width: 40,
                        height: 40,
                        background: active ? 'rgba(192,132,252,0.16)' : 'rgba(255,255,255,0.04)',
                        borderColor: active ? 'rgba(192,132,252,0.3)' : 'rgba(255,255,255,0.07)',
                        color: active ? '#d8b4fe' : 'var(--ink-muted)',
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14, marginBottom: 2 }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                        {p.description}
                      </div>
                    </div>
                    {smtp?.provider === p.id && smtp?.verified && (
                      <span className="badge badge-green" style={{ whiteSpace: 'nowrap' }}>
                        Connected
                      </span>
                    )}
                    {active && (
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: 'var(--brand-gradient)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* OAuth flow UI */}
          {isOAuth && (
            <section className="card fade-in" style={{ padding: 24, marginBottom: 20 }}>
              {isConnected ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <span
                      className="icon-tile"
                      style={{
                        background: 'rgba(34,197,94,0.12)',
                        borderColor: 'rgba(34,197,94,0.22)',
                        color: '#4ade80',
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                        Connected account
                      </div>
                      <div style={{ fontSize: 13, color: '#4ade80', marginTop: 2 }}>{smtp?.oauth_email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => testMutation.mutate()}
                      disabled={testMutation.isPending}
                    >
                      <Send size={14} /> {testMutation.isPending ? 'Sending…' : 'Send test email'}
                    </button>
                    <button
                      className="btn-danger"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() =>
                        oauthDisconnectMutation.mutate(selectedProvider === 'gmail_oauth' ? 'gmail' : 'zoho')
                      }
                      disabled={oauthDisconnectMutation.isPending}
                    >
                      <X size={14} /> Disconnect
                    </button>
                  </div>
                </>
              ) : isOAuthNeedEmail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      className="icon-tile"
                      style={{
                        background: 'rgba(234,179,8,0.12)',
                        borderColor: 'rgba(234,179,8,0.22)',
                        color: '#facc15',
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                        Almost there
                      </div>
                      <div style={{ fontSize: 12.5, color: '#facc15', marginTop: 2 }}>
                        OAuth connected — enter your Zoho email to finish setup.
                      </div>
                    </div>
                  </div>
                  <Field label="Your Zoho email" htmlFor="zoho-email-input" hint="The email address you use with Zoho Mail.">
                    <input
                      id="zoho-email-input"
                      className="input"
                      placeholder="you@zohomail.com"
                      value={zohoEmailInput}
                      onChange={e => setZohoEmailInput(e.target.value)}
                    />
                  </Field>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button
                      className="btn-primary"
                      onClick={() => zohoSetEmailMutation.mutate()}
                      disabled={!zohoEmailInput || zohoSetEmailMutation.isPending}
                    >
                      {zohoSetEmailMutation.isPending ? 'Saving…' : 'Set email & verify'}
                    </button>
                    <button
                      className="btn-danger"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => oauthDisconnectMutation.mutate('zoho')}
                      disabled={oauthDisconnectMutation.isPending}
                    >
                      <X size={14} /> Disconnect
                    </button>
                  </div>
                </div>
              ) : selectedProvider === 'gmail_oauth' ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <span
                    className="icon-tile"
                    style={{
                      width: 56,
                      height: 56,
                      margin: '0 auto 14px',
                      background: 'rgba(192,132,252,0.12)',
                    }}
                  >
                    <Mail size={26} />
                  </span>
                  <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
                    Connect Gmail
                  </h3>
                  <p style={{ margin: '0 auto 18px', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: 380 }}>
                    Authorize Waitless to send email on your behalf. You'll be redirected to Google to grant access — no
                    password is ever stored.
                  </p>
                  <button
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    onClick={() => oauthConnectMutation.mutate('gmail')}
                    disabled={oauthConnectMutation.isPending}
                  >
                    <ExternalLink size={15} />
                    {oauthConnectMutation.isPending ? 'Redirecting…' : 'Connect with Google'}
                  </button>
                </div>
              ) : (
                <div style={{ padding: '4px 0' }}>
                  <span
                    className="icon-tile"
                    style={{
                      width: 56,
                      height: 56,
                      margin: '0 auto 14px',
                      display: 'flex',
                      background: 'rgba(129,140,248,0.12)',
                      borderColor: 'rgba(129,140,248,0.22)',
                      color: '#818cf8',
                    }}
                  >
                    <Mail size={26} />
                  </span>
                  <h3 style={{ margin: '0 0 18px', fontSize: 17, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>
                    Connect Zoho Mail
                  </h3>

                  {/* Mode tabs */}
                  <div className="tabs" style={{ marginBottom: 20 }}>
                    {(['manual', 'redirect'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        className={cn('tab', zohoMode === m && 'active')}
                        onClick={() => setZohoMode(m)}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        {m === 'manual' ? <Clipboard size={13} /> : <Link2 size={13} />}
                        {m === 'manual' ? 'Paste auth code' : 'Redirect OAuth'}
                      </button>
                    ))}
                  </div>

                  {zohoMode === 'manual' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(234,179,8,0.08)',
                          border: '1px solid rgba(234,179,8,0.2)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 12.5,
                          color: '#facc15',
                          lineHeight: 1.7,
                        }}
                      >
                        <strong>Self Client setup</strong>
                        <br />
                        1. Go to{' '}
                        <a
                          href="https://api-console.zoho.com"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#818cf8' }}
                        >
                          api-console.zoho.com
                        </a>{' '}
                        → Self Client
                        <br />
                        2. Enter scope:{' '}
                        <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                          ZohoMail.messages.CREATE,ZohoMail.accounts.READ
                        </code>
                        <br />
                        3. Set duration to <strong>10 minutes</strong>, then generate the code
                        <br />
                        4. Paste it below immediately
                      </div>
                      <Field label="Authorization code" htmlFor="zoho-code">
                        <input
                          id="zoho-code"
                          className="input"
                          placeholder="Paste your Zoho Self Client authorization code"
                          value={zohoManualCode}
                          onChange={e => setZohoManualCode(e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Your Zoho email"
                        htmlFor="zoho-manual-email"
                        hint="e.g. you@zoho.com — used as the sender address."
                      >
                        <input
                          id="zoho-manual-email"
                          className="input"
                          placeholder="you@zohomail.com"
                          value={zohoManualEmail}
                          onChange={e => setZohoManualEmail(e.target.value)}
                        />
                      </Field>
                      <button
                        className="btn-primary"
                        style={{ alignSelf: 'flex-start' }}
                        onClick={() => zohoExchangeMutation.mutate()}
                        disabled={!zohoManualCode || !zohoManualEmail || zohoExchangeMutation.isPending}
                      >
                        {zohoExchangeMutation.isPending ? 'Connecting…' : 'Connect Zoho Mail'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                        Use this if you have a <strong>Server-based Application</strong> client in the Zoho API Console
                        with redirect URI:
                      </p>
                      <div className="copy-box" style={{ marginBottom: 16, justifyContent: 'center', fontSize: 12 }}>
                        {window.location.origin}/api/oauth/zoho/callback
                      </div>
                      <button
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        onClick={() => oauthConnectMutation.mutate('zoho')}
                        disabled={oauthConnectMutation.isPending}
                      >
                        <ExternalLink size={15} />
                        {oauthConnectMutation.isPending ? 'Redirecting…' : 'Connect via redirect'}
                      </button>
                    </div>
                  )}

                  <p style={{ margin: '16px 0 0', fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'center' }}>
                    Requires <code>ZOHO_CLIENT_ID</code> and <code>ZOHO_CLIENT_SECRET</code> in your <code>.env</code>.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Manual SMTP config */}
          {selectedProvider === 'smtp' && (
            <div className="fade-in">
              <section className="card" style={{ padding: 28, marginBottom: 20 }}>
                <h2
                  style={{
                    margin: '0 0 22px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                  }}
                >
                  <span className="icon-tile" style={{ width: 32, height: 32, borderRadius: 10 }}>
                    <Mail size={15} />
                  </span>
                  SMTP configuration
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 12 }}>
                    <Field label="SMTP host" htmlFor="smtp-host">
                      <input
                        id="smtp-host"
                        className="input"
                        placeholder="smtp.gmail.com"
                        value={form.host}
                        onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                      />
                    </Field>
                    <Field label="Port" htmlFor="smtp-port">
                      <input
                        id="smtp-port"
                        className="input"
                        type="number"
                        placeholder="587"
                        value={form.port}
                        onChange={e => setForm(f => ({ ...f, port: +e.target.value }))}
                      />
                    </Field>
                  </div>

                  <Field label="Username / email" htmlFor="smtp-username">
                    <input
                      id="smtp-username"
                      className="input"
                      placeholder="user@example.com"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    />
                  </Field>

                  <Field
                    label="Password"
                    htmlFor="smtp-password"
                    hint={smtp ? 'Leave empty to keep your existing password.' : undefined}
                  >
                    <input
                      id="smtp-password"
                      className="input"
                      type="password"
                      placeholder={smtp ? '••••••••' : 'Enter password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="From email" htmlFor="smtp-from-email">
                      <input
                        id="smtp-from-email"
                        className="input"
                        placeholder="noreply@example.com"
                        value={form.from_email}
                        onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))}
                      />
                    </Field>
                    <Field label="From name" htmlFor="smtp-from-name">
                      <input
                        id="smtp-from-name"
                        className="input"
                        placeholder="My Product"
                        value={form.from_name}
                        onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <label htmlFor="tls" style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-soft)' }}>
                        Enable TLS / STARTTLS
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2 }}>
                        Recommended for most providers on port 587.
                      </div>
                    </label>
                    <button
                      type="button"
                      id="tls"
                      role="switch"
                      aria-checked={form.tls}
                      aria-label="Enable TLS/STARTTLS"
                      className={cn('switch', form.tls && 'on')}
                      onClick={() => setForm(f => ({ ...f, tls: !f.tls }))}
                    />
                  </div>
                </div>
              </section>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving…' : 'Save settings'}
                </button>
                <button
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending || !smtp}
                >
                  <Send size={14} /> {testMutation.isPending ? 'Sending…' : 'Send test email'}
                </button>
              </div>

              {/* Quick presets */}
              <section className="card" style={{ padding: 24 }}>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <Zap size={15} color="#facc15" /> Quick presets
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--ink-muted)' }}>
                  Click a provider to autofill host and port.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  {SMTP_PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, host: p.host, port: p.port, tls: p.tls }))}
                      className="preset-btn"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'border-color 0.18s ease, background 0.18s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(192,132,252,0.25)'
                        e.currentTarget.style.background = 'rgba(192,132,252,0.06)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{p.name}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#c084fc',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          marginTop: 3,
                        }}
                      >
                        {p.host}:{p.port}
                      </span>
                      {p.note && (
                        <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.4 }}>
                          {p.note}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
