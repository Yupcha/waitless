import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Send, CheckCircle2, Bell, BellOff } from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/$id/telegram')({
  component: TelegramPage,
})

function TelegramPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()

  const { data: cfg } = useQuery({
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

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={16} color="#38bdf8" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Telegram Notifications</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Get notified in Telegram when events happen</p>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.1)' }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Quick Setup</p>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
          <li>Open Telegram, search for <strong>@BotFather</strong></li>
          <li>Send <code>/newbot</code> and follow the steps to create a bot</li>
          <li>Copy the <strong>Bot Token</strong> and paste it below</li>
          <li>Add the bot to a group or send <code>/start</code> to it directly</li>
          <li>Get your <strong>Chat ID</strong> by sending a message and visiting <code>api.telegram.org/bot[TOKEN]/getUpdates</code></li>
        </ol>
      </div>

      <form onSubmit={e => { e.preventDefault(); saveMut.mutate() }}>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Bot Token</label>
              <input className="input" placeholder="123456:ABC-DEF..." value={form.bot_token}
                onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Chat ID</label>
              <input className="input" placeholder="-1001234567890 or 123456789" value={form.chat_id}
                onChange={e => setForm(f => ({ ...f, chat_id: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Event toggles */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Notification Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'notify_signup', label: 'New Subscriber', desc: 'When someone joins the waitlist', icon: Bell },
              { key: 'notify_coupon', label: 'Coupon Redeemed', desc: 'When a coupon code is marked as used', icon: CheckCircle2 },
              { key: 'notify_unsubscribe', label: 'Unsubscribed', desc: 'When someone leaves the waitlist', icon: BellOff },
            ].map(ev => (
              <label key={ev.key} style={{
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                padding: '12px 14px', borderRadius: 10,
                background: (form as any)[ev.key] ? 'rgba(56,189,248,0.06)' : 'transparent',
                border: '1px solid',
                borderColor: (form as any)[ev.key] ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                transition: 'all 0.15s',
              }}>
                <input type="checkbox" checked={(form as any)[ev.key]}
                  onChange={e => setForm(f => ({ ...f, [ev.key]: e.target.checked }))} />
                <ev.icon size={16} color={(form as any)[ev.key] ? '#38bdf8' : '#475569'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{ev.label}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{ev.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Campaign filter */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Campaign Filter</h3>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569' }}>
            Only notify for specific promo codes (comma-separated). Leave empty for all campaigns.
          </p>
          <input className="input" placeholder="get5, promo6, earlybird" value={form.campaign_filter}
            onChange={e => setForm(f => ({ ...f, campaign_filter: e.target.value.toLowerCase() }))} />
        </div>

        {/* Enable + actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
            <span style={{ fontSize: 14, fontWeight: 600, color: form.enabled ? '#4ade80' : '#64748b' }}>
              {form.enabled ? 'Notifications Enabled' : 'Notifications Disabled'}
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}
            disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          <button type="button" className="btn-secondary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => testMut.mutate()} disabled={testMut.isPending || !form.bot_token || !form.chat_id}>
            <Send size={13} /> {testMut.isPending ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </form>
    </div>
  )
}
