import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { publicApi } from '@/lib/api'
import { useState } from 'react'
import { Hourglass, CheckCircle, Mail, User, Gift, Copy, Check, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { getDaysLeft } from '@/lib/utils'

export const Route = createFileRoute('/w/$slug')({
  component: WaitlistPage,
})

function WaitlistPage() {
  const { slug } = Route.useParams()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({ name: '', email: '' })
  const [coupon, setCoupon] = useState<any>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showPromo, setShowPromo] = useState(false)

  // Read promo code from URL: /w/my-project?promo=get5
  const urlPromo = new URLSearchParams(window.location.search).get('promo') || ''
  const [promo, setPromo] = useState(urlPromo)

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-project', slug],
    queryFn: () => publicApi.getProject(slug).then(r => r.data),
    retry: false,
  })

  // Parse custom fields from project
  const customFields: any[] = (() => {
    try { return JSON.parse(data?.project?.custom_fields || '[]') } catch { return [] }
  })()

  const signupMutation = useMutation({
    mutationFn: () => {
      const customData: Record<string, any> = {}
      customFields.forEach(f => {
        if (form[`cf_${f.key}`] !== undefined && form[`cf_${f.key}`] !== '') {
          customData[f.key] = form[`cf_${f.key}`]
        }
      })
      return publicApi.subscribe(slug, {
        name: form.name, email: form.email,
        ...(promo ? { promo } : {}),
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      })
    },
    onSuccess: (res: any) => {
      setSubmitted(true)
      if (res.data?.coupon) setCoupon(res.data.coupon)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error
      if (msg === 'already subscribed') toast.error("You're already on the list!")
      else toast.error(msg || 'Something went wrong')
    },
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b' }}>Loading...</div>
      </div>
    )
  }

  if (error || !data?.project) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 40, marginBottom: 16 }}>404</h1>
          <p style={{ color: '#64748b' }}>Waitlist not found.</p>
        </div>
      </div>
    )
  }

  const project = data.project
  const count: number = data.subscriber_count || 0
  const daysLeft = getDaysLeft(project.launch_date)
  const features: string[] = project.features ? project.features.split(',').map((f: string) => f.trim()).filter(Boolean) : []
  const themeColor = project.theme_color || '#6366f1'

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 0%, ${themeColor}22 0%, transparent 60%)`,
      }} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px,8vw,100px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start' }}>
          {/* Left col — offer */}
          <div>
            {/* Logo */}
            {project.logo_url && (
              <img src={project.logo_url} alt={project.name}
                style={{ height: 52, marginBottom: 28, objectFit: 'contain' }} />
            )}

            {/* Days badge */}
            {project.launch_date && daysLeft > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `rgba(${hexToRgb(themeColor)},0.15)`,
                border: `1px solid rgba(${hexToRgb(themeColor)},0.3)`,
                borderRadius: 100, padding: '6px 14px', marginBottom: 20,
                fontSize: 13, color: themeColor,
              }}>
                <Hourglass size={13} /> {daysLeft} days until launch
              </div>
            )}

            <h1 style={{
              margin: '0 0 16px', lineHeight: 1.15,
              fontSize: 'clamp(28px,5vw,46px)', fontWeight: 800,
              color: '#e2e8f0',
            }}>
              {project.description || `Join the waitlist for ${project.name}`}
            </h1>

            {project.offer_title && (
              <p style={{ margin: '0 0 24px', fontSize: 17, color: '#64748b', lineHeight: 1.5 }}>
                {project.offer_title}
              </p>
            )}

            {/* Pricing */}
            {project.discount_price && project.current_price && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '12px 18px', marginBottom: 24,
              }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>${project.discount_price}</span>
                <span style={{ fontSize: 15, color: '#64748b', textDecoration: 'line-through' }}>${project.current_price}</span>
                <span className="badge badge-yellow">
                  {Math.round((1 - +project.discount_price / +project.current_price) * 100)}% off
                </span>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: `rgba(${hexToRgb(themeColor)},0.2)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <CheckCircle size={12} color={themeColor} />
                    </div>
                    <span style={{ fontSize: 15, color: '#94a3b8' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Social proof */}
            {count > 0 && (
              <div style={{ marginTop: 28, fontSize: 14, color: '#64748b' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{count.toLocaleString()}</span> people already on the list
              </div>
            )}
          </div>

          {/* Right col — form */}
          <div>
            <div className="card" style={{ padding: 36 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(34,197,94,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle size={32} color="#4ade80" />
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
                    You're on the list! 🎉
                  </h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>
                    We'll email you when {project.name} launches. Keep an eye on your inbox!
                  </p>
                  {coupon && (
                    <div style={{
                      marginTop: 20, padding: '16px 20px', borderRadius: 12,
                      background: `rgba(${hexToRgb(themeColor)},0.08)`,
                      border: `1px solid rgba(${hexToRgb(themeColor)},0.2)`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Gift size={14} color={themeColor} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: themeColor }}>Your exclusive code</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{
                          flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: '0.05em',
                          color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '10px 14px',
                          borderRadius: 8, textAlign: 'center',
                        }}>{coupon.code}</code>
                        <button onClick={() => {
                          navigator.clipboard.writeText(coupon.code)
                          setCodeCopied(true)
                          setTimeout(() => setCodeCopied(false), 2000)
                        }} style={{
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8, padding: '10px', cursor: 'pointer', color: '#94a3b8',
                        }}>
                          {codeCopied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>
                        {coupon.discount_type === 'percent'
                          ? `${coupon.discount_value}% off`
                          : `${coupon.currency} ${coupon.discount_value} off`
                        }
                        {coupon.expires_at && ` · Expires ${new Date(coupon.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
                    Join the waitlist
                  </h2>
                  <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b' }}>
                    Be the first to know when we launch.
                  </p>

                  <form onSubmit={e => { e.preventDefault(); signupMutation.mutate() }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Honeypot */}
                    <input name="website" type="text" style={{ display: 'none' }} tabIndex={-1} />

                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                      <input className="input" type="text" placeholder="Your name"
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required style={{ paddingLeft: 36 }} />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                      <input className="input" type="email" placeholder="Email address"
                        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required style={{ paddingLeft: 36 }} />
                    </div>

                    {/* Custom fields */}

                    {/* Promo code */}
                    {urlPromo ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: `rgba(${hexToRgb(themeColor)},0.06)`, borderRadius: 8,
                        border: `1px solid rgba(${hexToRgb(themeColor)},0.15)`,
                      }}>
                        <Tag size={13} color={themeColor} />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Promo: <strong style={{ color: themeColor }}>{urlPromo}</strong></span>
                      </div>
                    ) : (
                      <div>
                        {!showPromo ? (
                          <button type="button" onClick={() => setShowPromo(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#475569', padding: 0 }}>
                            Have a promo code?
                          </button>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <Tag size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                            <input className="input" placeholder="Enter promo code"
                              value={promo} onChange={e => setPromo(e.target.value.toLowerCase())}
                              style={{ paddingLeft: 34 }} />
                          </div>
                        )}
                      </div>
                    )}

                    {customFields.map((cf: any) => (
                      <div key={cf.key}>
                        {cf.type === 'text' && (
                          <input className="input" placeholder={cf.placeholder || cf.label}
                            value={form[`cf_${cf.key}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.value }))}
                            required={cf.required} />
                        )}
                        {cf.type === 'textarea' && (
                          <textarea className="input" placeholder={cf.placeholder || cf.label} rows={3}
                            value={form[`cf_${cf.key}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.value }))}
                            required={cf.required} style={{ resize: 'vertical' }} />
                        )}
                        {cf.type === 'select' && (
                          <select className="input" value={form[`cf_${cf.key}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.value }))}
                            required={cf.required}>
                            <option value="">{cf.placeholder || cf.label}</option>
                            {(cf.options || []).map((o: string) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        )}
                        {cf.type === 'checkbox' && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!form[`cf_${cf.key}`]}
                              onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.checked }))} />
                            <span style={{ fontSize: 14, color: '#94a3b8' }}>{cf.label}</span>
                          </label>
                        )}
                      </div>
                    ))}

                    <button type="submit" className="btn-primary"
                      style={{
                        padding: '13px', fontSize: 15,
                        background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -20)})`,
                      }}
                      disabled={signupMutation.isPending}>
                      {signupMutation.isPending ? 'Joining...' : 'Join the Waitlist'}
                    </button>
                  </form>

                  <p style={{ margin: '14px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
                    No spam, ever. Unsubscribe at any time.
                  </p>
                </>
              )}
            </div>

            {/* Powered by */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
                <img src="/logo.png" style={{ height: 14, width: 14, borderRadius: 3, objectFit: 'cover' }} alt="" /> 
                Powered by Waitless
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function adjustColor(hex: string, amt: number): string {
  try {
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amt))
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amt))
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amt))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex
  }
}
