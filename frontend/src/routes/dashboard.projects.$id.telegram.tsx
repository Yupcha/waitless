import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Send, CheckCircle2, Bell, BellOff, KeyRound, Hash, Filter, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/projects/$id/telegram')({
  component: TelegramPage,
})

function TelegramPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['telegram', id],
    queryFn: () => api.get(`/dashboard/projects/${id}/telegram`).then(r => r.data),
  })

  const [form, setForm] = useState({
    bot_token: '', chat_id: '', enabled: false,
    notify_signup: true, notify_coupon: false, notify_unsubscribe: false,
    campaign_filter: '',
  })

  useEffect(() => {
    if (cfg && cfg.id) {
      setForm({
        bot_token: cfg.bot_token || '',
        chat_id: cfg.chat_id || '',
        enabled: cfg.enabled || false,
        notify_signup: cfg.notify_signup ?? true,
        notify_coupon: cfg.notify_coupon || false,
        notify_unsubscribe: cfg.notify_unsubscribe || false,
        campaign_filter: cfg.campaign_filter || '',
      })
    }
  }, [cfg])

  const saveMut = useMutation({
    mutationFn: () => api.put(`/dashboard/projects/${id}/telegram`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['telegram', id] }); toast.success('Saved') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const testMut = useMutation({
    mutationFn: () => api.post(`/dashboard/projects/${id}/telegram/test`),
    onSuccess: () => toast.success('Test message sent! Check your Telegram.'),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to send test'),
  })

  const events = [
    { key: 'notify_signup', label: 'New subscriber', desc: 'When someone joins the waitlist', icon: Bell },
    { key: 'notify_coupon', label: 'Coupon redeemed', desc: 'When a coupon code is marked as used', icon: CheckCircle2 },
    { key: 'notify_unsubscribe', label: 'Unsubscribed', desc: 'When someone leaves the waitlist', icon: BellOff },
  ] as const

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div className="icon-tile" style={{ width: 48, height: 48, flexShrink: 0 }}>
          <Send size={20} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Telegram notifications
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 14, color: 'var(--ink-faint)' }}>
            Get a ping in Telegram the moment something happens on your waitlist.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ height: 168, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Quick setup ── */}
          <div
            className="card"
            style={{
              padding: 22,
              background: 'linear-gradient(145deg, rgba(129,140,248,0.08), rgba(192,132,252,0.04))',
              border: '1px solid rgba(129,140,248,0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                className="badge badge-purple"
                style={{ background: 'rgba(129,140,248,0.16)', color: '#a5b4fc', borderColor: 'rgba(129,140,248,0.28)' }}
              >
                Quick setup
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>~2 minutes</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.9 }}>
              <li>Open Telegram and search for <strong style={{ color: 'var(--ink-soft)' }}>@BotFather</strong>.</li>
              <li>Send <Code>/newbot</Code> and follow the steps to create your bot.</li>
              <li>Copy the <strong style={{ color: 'var(--ink-soft)' }}>bot token</strong> and paste it below.</li>
              <li>Add the bot to a group, or send it <Code>/start</Code> directly.</li>
              <li>
                Find your <strong style={{ color: 'var(--ink-soft)' }}>chat ID</strong> by sending a message and opening{' '}
                <Code>api.telegram.org/bot[TOKEN]/getUpdates</Code>.
              </li>
            </ol>
          </div>

          <form onSubmit={e => { e.preventDefault(); saveMut.mutate() }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ── Credentials ── */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeading title="Bot credentials" desc="Your private connection to the Telegram Bot API." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
                <div>
                  <label htmlFor="bot_token" className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={13} /> Bot token
                  </label>
                  <input
                    id="bot_token"
                    className="input"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={form.bot_token}
                    onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))}
                  />
                  <p className="help-text">Issued by @BotFather. Kept private and never shown publicly.</p>
                </div>
                <div>
                  <label htmlFor="chat_id" className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={13} /> Chat ID
                  </label>
                  <input
                    id="chat_id"
                    className="input"
                    placeholder="-1001234567890  or  123456789"
                    value={form.chat_id}
                    onChange={e => setForm(f => ({ ...f, chat_id: e.target.value }))}
                  />
                  <p className="help-text">Use a negative ID for groups, a positive ID for direct messages.</p>
                </div>
              </div>
            </div>

            {/* ── Event toggles ── */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeading title="Notification events" desc="Choose which moments are worth a notification." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                {events.map(ev => {
                  const on = (form as any)[ev.key] as boolean
                  return (
                    <label
                      key={ev.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        cursor: 'pointer',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: on ? 'rgba(192,132,252,0.07)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: on ? 'rgba(192,132,252,0.22)' : 'rgba(255,255,255,0.05)',
                        transition: 'all var(--transition-smooth)',
                      }}
                    >
                      <span
                        className="icon-tile"
                        style={{
                          width: 38,
                          height: 38,
                          background: on ? 'rgba(192,132,252,0.14)' : 'rgba(255,255,255,0.04)',
                          borderColor: on ? 'rgba(192,132,252,0.28)' : 'rgba(255,255,255,0.07)',
                          color: on ? '#d8b4fe' : 'var(--ink-faint)',
                        }}
                      >
                        <ev.icon size={17} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{ev.label}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{ev.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={e => setForm(f => ({ ...f, [ev.key]: e.target.checked }))}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                      <span className={cn('switch', on && 'on')} aria-hidden="true" />
                    </label>
                  )
                })}
              </div>
            </div>

            {/* ── Campaign filter ── */}
            <div className="card" style={{ padding: 24 }}>
              <SectionHeading
                title="Campaign filter"
                desc="Only notify for specific promo codes (comma-separated). Leave empty to notify for every campaign."
              />
              <div style={{ marginTop: 18 }}>
                <label htmlFor="campaign_filter" className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Filter size={13} /> Promo codes
                </label>
                <input
                  id="campaign_filter"
                  className="input"
                  placeholder="get5, promo6, earlybird"
                  value={form.campaign_filter}
                  onChange={e => setForm(f => ({ ...f, campaign_filter: e.target.value.toLowerCase() }))}
                />
              </div>
            </div>

            {/* ── Master enable ── */}
            <label
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                padding: 20,
                background: form.enabled
                  ? 'linear-gradient(145deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
                  : undefined,
                borderColor: form.enabled ? 'rgba(34,197,94,0.22)' : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                  {form.enabled ? 'Notifications enabled' : 'Notifications disabled'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 2 }}>
                  {form.enabled
                    ? 'Telegram messages will be delivered for the events above.'
                    : 'Turn this on to start delivering messages to Telegram.'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <span className={cn('switch', form.enabled && 'on')} aria-hidden="true" />
            </label>

            {/* ── Actions ── */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                position: 'sticky',
                bottom: 16,
                background: 'rgba(14,12,18,0.85)',
                backdropFilter: 'blur(8px)',
                padding: '12px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <button
                type="submit"
                className="btn-primary"
                disabled={saveMut.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {saveMut.isPending && <Loader2 size={15} className="spin" style={{ animation: 'spin 0.8s linear infinite' }} />}
                {saveMut.isPending ? 'Saving...' : 'Save settings'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => testMut.mutate()}
                disabled={testMut.isPending || !form.bot_token || !form.chat_id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {testMut.isPending ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
                {testMut.isPending ? 'Sending...' : 'Send test'}
              </button>
              {(!form.bot_token || !form.chat_id) && (
                <span style={{ fontSize: 12.5, color: 'var(--ink-dim)', alignSelf: 'center' }}>
                  Add a bot token and chat ID to send a test.
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function SectionHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-faint)', lineHeight: 1.5 }}>{desc}</p>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '1px 6px',
        color: 'var(--ink-soft)',
      }}
    >
      {children}
    </code>
  )
}
