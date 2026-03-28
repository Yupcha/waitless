import { createFileRoute, Link } from '@tanstack/react-router'
import { Shield, Globe, BarChart3, Code2, Mail, ArrowRight, Star, Terminal } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(11,15,26,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" style={{
            width: 32, height: 32, borderRadius: 8, objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)', flexShrink: 0
          }} alt="Waitless" />
          <span style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Waitless</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="https://github.com/waitless/waitless" target="_blank" rel="noreferrer"
            className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <GithubIcon /> GitHub
          </a>
          <Link to="/docs" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, padding: '7px 14px' }}>
            Docs
          </Link>
          <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, padding: '7px 14px' }}>
            Login
          </Link>
          <Link to="/register" className="btn-primary" style={{ padding: '7px 18px', fontSize: 13, textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: 140, paddingBottom: 80, textAlign: 'center', padding: '140px 24px 80px', position: 'relative' }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 200, left: '20%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none', animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: 120, right: '15%',
          width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', animation: 'float 10s ease-in-out infinite reverse',
        }} />

        <div className="fade-in" style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 36,
            fontSize: 13, color: '#818cf8', fontWeight: 500,
          }}>
            <Star size={12} fill="currentColor" /> Open-source · MIT License
          </div>

          <h1 style={{
            fontSize: 'clamp(40px,6.5vw,76px)', fontWeight: 900,
            lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.03em',
          }}>
            <span className="gradient-text">Collect waitlist</span><br />
            <span className="gradient-text">signups </span>
            <span className="gradient-text-brand">your way</span>
          </h1>

          <p style={{ fontSize: 19, color: '#64748b', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Self-hosted waitlist platform with your own SMTP. Multi-tenant, embeddable, open-source. No lock-in.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{
              padding: '14px 32px', fontSize: 16, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <a href="https://github.com/waitless/waitless" target="_blank" rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '14px 28px', fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <GithubIcon /> View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Terminal preview */}
      <div style={{ maxWidth: 700, margin: '0 auto 100px', padding: '0 24px' }}>
        <div className="card fade-in-up" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)',
          }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308', opacity: 0.7 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', opacity: 0.7 }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: '#475569' }}>terminal</span>
          </div>
          <div style={{ padding: '20px 20px', fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
            <div><span style={{ color: '#22c55e' }}>$</span> <span style={{ color: '#94a3b8' }}>curl -X POST /api/public/w/my-app/subscribe \</span></div>
            <div style={{ paddingLeft: 16 }}><span style={{ color: '#94a3b8' }}>-d '</span><span style={{ color: '#818cf8' }}>{'{"email":"user@example.com"}'}</span><span style={{ color: '#94a3b8' }}>'</span></div>
            <div style={{ color: '#475569', margin: '4px 0' }}></div>
            <div><span style={{ color: '#facc15' }}>{'{'}</span></div>
            <div style={{ paddingLeft: 16 }}><span style={{ color: '#94a3b8' }}>"message":</span> <span style={{ color: '#4ade80' }}>"subscribed"</span>,</div>
            <div style={{ paddingLeft: 16 }}><span style={{ color: '#94a3b8' }}>"subscriber":</span> <span style={{ color: '#facc15' }}>{'{'}</span> <span style={{ color: '#94a3b8' }}>"id":</span> <span style={{ color: '#4ade80' }}>"AbPjb8GbmjcJ"</span> <span style={{ color: '#facc15' }}>{'}'}</span></div>
            <div><span style={{ color: '#facc15' }}>{'}'}</span></div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Everything you need</h2>
          <p style={{ fontSize: 16, color: '#475569', margin: 0 }}>Built for developers who want full control</p>
        </div>

        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="card-glow" style={{ padding: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                background: `rgba(${f.color},0.1)`, border: `1px solid rgba(${f.color},0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={22} color={`rgb(${f.color})`} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{f.title}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '80px 24px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 500, height: 300,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 16px', color: '#e2e8f0', letterSpacing: '-0.02em' }}>Ready to launch faster?</h2>
          <p style={{ color: '#475569', fontSize: 17, margin: '0 0 40px' }}>
            Deploy with a single binary. No dependencies except PostgreSQL.
          </p>
          <Link to="/register" className="btn-primary" style={{ padding: '16px 36px', fontSize: 16, textDecoration: 'none' }}>
            Create your first waitlist →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 13, color: '#334155',
        display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <span>© {new Date().getFullYear()} Waitless</span>
        <Link to="/privacy-policy" style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</Link>
        <a href="https://github.com/waitless/waitless" target="_blank" rel="noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>GitHub</a>
      </footer>
    </div>
  )
}

const features = [
  { icon: Mail, color: '99,102,241', title: 'Your own SMTP', desc: 'Use any email provider — Gmail, Mailgun, SES, or self-hosted. Full control over deliverability.' },
  { icon: Globe, color: '34,197,94', title: 'Multi-tenant', desc: 'Create unlimited waitlist projects. Each with its own page, branding and subscriber list.' },
  { icon: Shield, color: '251,191,36', title: 'Access control', desc: 'Role-based access with admin dashboard. Users manage their own projects independently.' },
  { icon: BarChart3, color: '239,68,68', title: 'Analytics', desc: 'Track page views, signups, email delivery rates and subscriber growth over time.' },
  { icon: Code2, color: '168,85,247', title: 'REST API & Widget', desc: 'Full REST API with key auth. Embed a waitlist form on any site with one snippet.' },
  { icon: Terminal, color: '59,130,246', title: 'Single binary + CLI', desc: 'Deploy anywhere with one binary. Built-in CLI for user management, backups, and restores.' },
]
