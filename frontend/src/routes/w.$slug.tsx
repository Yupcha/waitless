import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { publicApi } from '@/lib/api'
import { useState } from 'react'
import { Hourglass, CheckCircle, Mail, User, Gift, Copy, Check, Tag, Users, Sparkles } from 'lucide-react'
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

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(40px,8vw,100px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 48,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 100 }} />
              <div className="skeleton" style={{ height: 44, width: '90%', borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 44, width: '70%', borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 20, width: '80%', borderRadius: 8, marginTop: 8 }} />
              <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 8 }} />
            </div>
            <div className="card" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="skeleton" style={{ height: 24, width: 140, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 100, marginTop: 6 }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- Error / not found state ----
  if (error || !data?.project) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div className="card fade-in-up" style={{ maxWidth: 420, textAlign: 'center', padding: 'clamp(32px,6vw,48px)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            <Hourglass size={26} color="#f87171" />
          </div>
          <h1 className="gradient-text-brand" style={{ margin: '0 0 10px', fontSize: 32, fontWeight: 800 }}>
            Waitlist not found
          </h1>
          <p style={{ margin: '0 0 24px', color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.5 }}>
            This waitlist doesn&apos;t exist or may have been removed. Double-check the link and try again.
          </p>
          <a href="/" className="btn-secondary" style={{ display: 'inline-flex' }}>
            Go to Waitless
          </a>
        </div>
      </div>
    )
  }

  const project = data.project
  const count: number = data.subscriber_count || 0
  const daysLeft = getDaysLeft(project.launch_date)
  const features: string[] = project.features ? project.features.split(',').map((f: string) => f.trim()).filter(Boolean) : []
  const themeColor = project.theme_color || '#c084fc'
  const themeRgb = hexToRgb(themeColor)
  const ctaGradient = `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -30)})`

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Themed background glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% -10%, rgba(${themeRgb},0.18) 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(${themeRgb},0.08) 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1000,
          margin: '0 auto',
          padding: 'clamp(40px,8vw,100px) 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 48,
            alignItems: 'start',
          }}
        >
          {/* Left col — offer / story */}
          <div className="fade-in-up">
            {/* Logo */}
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.name}
                style={{ height: 52, marginBottom: 28, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 28 }}>
                {project.name}
              </div>
            )}

            {/* Days badge */}
            {project.launch_date && daysLeft > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: `rgba(${themeRgb},0.12)`,
                  border: `1px solid rgba(${themeRgb},0.28)`,
                  borderRadius: 100,
                  padding: '6px 14px',
                  marginBottom: 22,
                  fontSize: 13,
                  fontWeight: 600,
                  color: themeColor,
                }}
              >
                <Hourglass size={13} /> Launching in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
              </div>
            )}

            <h1
              style={{
                margin: '0 0 16px',
                lineHeight: 1.12,
                fontSize: 'clamp(30px,5vw,48px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
              }}
            >
              {project.description || `Join the waitlist for ${project.name}`}
            </h1>

            {project.offer_title && (
              <p style={{ margin: '0 0 26px', fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                {project.offer_title}
              </p>
            )}

            {/* Pricing */}
            {project.discount_price && project.current_price && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '12px 18px',
                  marginBottom: 26,
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>${project.discount_price}</span>
                <span style={{ fontSize: 15, color: 'var(--ink-muted)', textDecoration: 'line-through' }}>
                  ${project.current_price}
                </span>
                <span className="badge badge-yellow">
                  {Math.round((1 - +project.discount_price / +project.current_price) * 100)}% off
                </span>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        background: `rgba(${themeRgb},0.18)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle size={13} color={themeColor} />
                    </div>
                    <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Social proof */}
            {count > 0 && (
              <div
                style={{
                  marginTop: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                  fontSize: 14,
                  color: 'var(--ink-muted)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `rgba(${themeRgb},0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Users size={14} color={themeColor} />
                </div>
                <span>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{count.toLocaleString()}</span> already on the
                  list
                </span>
              </div>
            )}
          </div>

          {/* Right col — signup form */}
          <div className="fade-in-up" style={{ animationDelay: '0.08s' }}>
            <div className="card-glow" style={{ padding: 'clamp(24px,4vw,36px)' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      margin: '0 auto 20px',
                      background: 'rgba(74,222,128,0.14)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle size={32} color="#4ade80" />
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 800, color: 'var(--ink)' }}>
                    You&apos;re on the list! 🎉
                  </h2>
                  <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.55 }}>
                    We&apos;ll email you the moment {project.name} launches. Keep an eye on your inbox.
                  </p>
                  {coupon && (
                    <div
                      style={{
                        marginTop: 22,
                        padding: '18px 20px',
                        borderRadius: 16,
                        background: `rgba(${themeRgb},0.08)`,
                        border: `1px solid rgba(${themeRgb},0.22)`,
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                        <Gift size={14} color={themeColor} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: themeColor }}>Your exclusive code</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code
                          style={{
                            flex: 1,
                            fontSize: 18,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: 'var(--ink)',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '11px 14px',
                            borderRadius: 10,
                            textAlign: 'center',
                          }}
                        >
                          {coupon.code}
                        </code>
                        <button
                          type="button"
                          aria-label="Copy code"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code)
                            setCodeCopied(true)
                            setTimeout(() => setCodeCopied(false), 2000)
                          }}
                          className="icon-btn"
                          style={{ flexShrink: 0 }}
                        >
                          {codeCopied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
                        {coupon.discount_type === 'percent'
                          ? `${coupon.discount_value}% off`
                          : `${coupon.currency} ${coupon.discount_value} off`}
                        {coupon.expires_at && ` · Expires ${new Date(coupon.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Sparkles size={18} color={themeColor} />
                    <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--ink)' }}>
                      Join the waitlist
                    </h2>
                  </div>
                  <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-muted)' }}>
                    Be the first to know when we launch.
                  </p>

                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      signupMutation.mutate()
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    {/* Honeypot */}
                    <input name="website" type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                    <div>
                      <label htmlFor="wl-name" className="field-label">
                        Name
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
                          size={15}
                          style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}
                        />
                        <input
                          id="wl-name"
                          className="input"
                          type="text"
                          placeholder="Your name"
                          autoComplete="name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                          style={{ paddingLeft: 38 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wl-email" className="field-label">
                        Email
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail
                          size={15}
                          style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}
                        />
                        <input
                          id="wl-email"
                          className="input"
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          required
                          style={{ paddingLeft: 38 }}
                        />
                      </div>
                    </div>

                    {/* Custom fields */}
                    {customFields.map((cf: any) => (
                      <div key={cf.key}>
                        {cf.label && cf.type !== 'checkbox' && (
                          <label className="field-label">
                            {cf.label}
                            {cf.required && <span style={{ color: '#f87171' }}> *</span>}
                          </label>
                        )}
                        {cf.type === 'text' && (
                          <input
                            className="input"
                            placeholder={cf.placeholder || cf.label}
                            value={form[`cf_${cf.key}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.value }))}
                            required={cf.required}
                          />
                        )}
                        {cf.type === 'textarea' && (
                          <textarea
                            className="input"
                            placeholder={cf.placeholder || cf.label}
                            rows={3}
                            value={form[`cf_${cf.key}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.value }))}
                            required={cf.required}
                            style={{ resize: 'vertical' }}
                          />
                        )}
                        {cf.type === 'select' && (
                          <select
                            className="input"
                            value={form[`cf_${cf.key}`] || ''}
                            onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.value }))}
                            required={cf.required}
                          >
                            <option value="">{cf.placeholder || cf.label}</option>
                            {(cf.options || []).map((o: string) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        )}
                        {cf.type === 'checkbox' && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!form[`cf_${cf.key}`]}
                              onChange={e => setForm(f => ({ ...f, [`cf_${cf.key}`]: e.target.checked }))}
                            />
                            <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{cf.label}</span>
                          </label>
                        )}
                      </div>
                    ))}

                    {/* Promo code */}
                    {urlPromo ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 13px',
                          background: `rgba(${themeRgb},0.06)`,
                          borderRadius: 10,
                          border: `1px solid rgba(${themeRgb},0.18)`,
                        }}
                      >
                        <Tag size={13} color={themeColor} />
                        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                          Promo applied: <strong style={{ color: themeColor }}>{urlPromo}</strong>
                        </span>
                      </div>
                    ) : (
                      <div>
                        {!showPromo ? (
                          <button
                            type="button"
                            onClick={() => setShowPromo(true)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: 'var(--ink-faint)',
                              padding: 0,
                            }}
                          >
                            Have a promo code?
                          </button>
                        ) : (
                          <div>
                            <label htmlFor="wl-promo" className="field-label">
                              Promo code
                            </label>
                            <div style={{ position: 'relative' }}>
                              <Tag
                                size={14}
                                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}
                              />
                              <input
                                id="wl-promo"
                                className="input"
                                placeholder="Enter promo code"
                                value={promo}
                                onChange={e => setPromo(e.target.value.toLowerCase())}
                                style={{ paddingLeft: 36 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{
                        padding: '13px',
                        fontSize: 15,
                        marginTop: 4,
                        background: ctaGradient,
                      }}
                      disabled={signupMutation.isPending}
                    >
                      {signupMutation.isPending ? 'Joining…' : 'Join the waitlist'}
                    </button>
                  </form>

                  <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center' }}>
                    No spam, ever. Unsubscribe at any time.
                  </p>
                </>
              )}
            </div>

            {/* Powered by */}
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--ink-faint)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
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
