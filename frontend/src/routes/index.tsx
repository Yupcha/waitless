import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Shield,
  Globe,
  BarChart3,
  Code2,
  Mail,
  ArrowRight,
  Star,
  Terminal,
} from 'lucide-react'
import { GithubIcon } from '@/components/icons'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px clamp(16px, 4vw, 40px)',
          background: 'rgba(14,12,18,0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <img
            src="/logo.png"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              flexShrink: 0,
            }}
            alt="Waitless logo"
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            Waitless
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <a
            href="https://github.com/waitless/waitless"
            target="_blank"
            rel="noreferrer"
            aria-label="View Waitless on GitHub"
            className="btn-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <GithubIcon /> <span className="nav-label">GitHub</span>
          </a>
          <Link to="/docs" className="btn-ghost" style={{ fontSize: 14, textDecoration: 'none' }}>
            Docs
          </Link>
          <Link to="/login" className="btn-ghost" style={{ fontSize: 14, textDecoration: 'none' }}>
            Login
          </Link>
          <Link
            to="/register"
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 13, textDecoration: 'none' }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: 'clamp(120px, 18vw, 168px) 24px clamp(64px, 9vw, 96px)',
        }}
      >
        {/* Warm floating orbs */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(760px, 92vw)',
            height: 440,
            background:
              'radial-gradient(ellipse, rgba(192,132,252,0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 180,
            left: '14%',
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(255,107,157,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'float 8s ease-in-out infinite',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 110,
            right: '12%',
            width: 280,
            height: 280,
            background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'float 10s ease-in-out infinite reverse',
            zIndex: 0,
          }}
        />

        <div className="fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(192,132,252,0.08)',
              border: '1px solid rgba(192,132,252,0.22)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              marginBottom: 32,
              fontSize: 13,
              color: '#a5b4fc',
              fontWeight: 500,
            }}
          >
            <Star size={12} fill="currentColor" /> Open source · MIT licensed · Self-hosted
          </div>

          <h1
            style={{
              fontSize: 'clamp(40px, 6.5vw, 76px)',
              fontWeight: 900,
              lineHeight: 1.05,
              margin: '0 auto 24px',
              maxWidth: 920,
              letterSpacing: '-0.03em',
            }}
          >
            <span className="gradient-text">Collect waitlist signups,</span>
            <br />
            <span className="gradient-text-brand">your way</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2.2vw, 19px)',
              color: 'var(--ink-soft)',
              maxWidth: 560,
              margin: '0 auto 44px',
              lineHeight: 1.7,
            }}
          >
            A self-hosted waitlist platform that runs on your own SMTP. Multi-tenant,
            embeddable, and fully open source — no vendor lock-in, ever.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/register"
              className="btn-primary"
              style={{
                padding: '14px 32px',
                fontSize: 16,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <a
              href="https://github.com/waitless/waitless"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{
                padding: '14px 28px',
                fontSize: 16,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GithubIcon /> View on GitHub
            </a>
          </div>

          <p
            style={{
              marginTop: 24,
              fontSize: 13,
              color: 'var(--ink-faint)',
            }}
          >
            Single binary deploy · PostgreSQL is the only dependency
          </p>
        </div>
      </header>

      {/* ── Terminal preview ───────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: '0 auto 110px', padding: '0 24px' }}>
        <div className="card fade-in-up" style={{ overflow: 'hidden', padding: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.25)',
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f87171', opacity: 0.8 }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#facc15', opacity: 0.8 }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#4ade80', opacity: 0.8 }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ink-faint)' }}>
              waitless — subscribe.sh
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '20px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
              lineHeight: 2,
              overflowX: 'auto',
              whiteSpace: 'pre',
            }}
          >
            <div>
              <span style={{ color: '#4ade80' }}>$</span>{' '}
              <span style={{ color: 'var(--ink-soft)' }}>curl -X POST /api/public/w/my-app/subscribe \</span>
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: 'var(--ink-soft)' }}>-d '</span>
              <span style={{ color: '#818cf8' }}>{'{"email":"user@example.com"}'}</span>
              <span style={{ color: 'var(--ink-soft)' }}>'</span>
            </div>
            <div style={{ color: 'var(--ink-faint)', margin: '4px 0' }}> </div>
            <div>
              <span style={{ color: '#facc15' }}>{'{'}</span>
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: 'var(--ink-soft)' }}>"message":</span>{' '}
              <span style={{ color: '#4ade80' }}>"subscribed"</span>,
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: 'var(--ink-soft)' }}>"subscriber":</span>{' '}
              <span style={{ color: '#facc15' }}>{'{'}</span>{' '}
              <span style={{ color: 'var(--ink-soft)' }}>"id":</span>{' '}
              <span style={{ color: '#4ade80' }}>"AbPjb8GbmjcJ"</span>{' '}
              <span style={{ color: '#facc15' }}>{'}'}</span>
            </div>
            <div>
              <span style={{ color: '#facc15' }}>{'}'}</span>
            </div>
          </pre>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
            }}
          >
            Everything you need to ship
          </h2>
          <p style={{ fontSize: 16, color: 'var(--ink-muted)', margin: 0 }}>
            Built for developers who want full control of their stack.
          </p>
        </div>

        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 20,
          }}
        >
          {features.map((f) => (
            <article key={f.title} className="card-glow" style={{ padding: 28 }}>
              <div
                className="icon-tile"
                style={{
                  marginBottom: 18,
                  background: `rgba(${f.color},0.10)`,
                  border: `1px solid rgba(${f.color},0.18)`,
                }}
              >
                <f.icon size={22} color={`rgb(${f.color})`} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                {f.title}
              </h3>
              <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA band ───────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '0 24px 96px' }}>
        <div
          className="card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            maxWidth: 920,
            margin: '0 auto',
            textAlign: 'center',
            padding: 'clamp(48px, 8vw, 72px) 24px',
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(192,132,252,0.12) 0%, transparent 60%), linear-gradient(145deg, rgba(28,22,38,0.9), rgba(18,14,26,0.7))',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: -120,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 480,
              height: 280,
              background: 'radial-gradient(ellipse, rgba(255,107,157,0.10) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 4.5vw, 42px)',
                fontWeight: 800,
                margin: '0 0 16px',
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              Ready to launch faster?
            </h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: 17, margin: '0 auto 36px', maxWidth: 480 }}>
              Spin up your first waitlist in minutes. One binary, your own SMTP, no surprises.
            </p>
            <Link
              to="/register"
              className="btn-primary"
              style={{
                padding: '16px 36px',
                fontSize: 16,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Create your first waitlist <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '28px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            flexWrap: 'wrap',
            fontSize: 13,
            color: 'var(--ink-dim)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              style={{ width: 18, height: 18, borderRadius: 5, objectFit: 'cover' }}
            />
            © {new Date().getFullYear()} Waitless
          </span>
          <Link to="/docs" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>
            Docs
          </Link>
          <Link to="/privacy-policy" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <a
            href="https://github.com/waitless/waitless"
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GithubIcon size={14} /> GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Mail,
    color: '192,132,252',
    title: 'Your own SMTP',
    desc: 'Connect any provider — Gmail, Mailgun, SES, or self-hosted. You own deliverability end to end.',
  },
  {
    icon: Globe,
    color: '74,222,128',
    title: 'Multi-tenant',
    desc: 'Create unlimited waitlist projects, each with its own page, branding, and subscriber list.',
  },
  {
    icon: Shield,
    color: '250,204,21',
    title: 'Access control',
    desc: 'Role-based permissions with an admin dashboard. Users manage their own projects independently.',
  },
  {
    icon: BarChart3,
    color: '248,113,113',
    title: 'Analytics',
    desc: 'Track page views, signups, delivery rates, and subscriber growth over time.',
  },
  {
    icon: Code2,
    color: '129,140,248',
    title: 'REST API & widget',
    desc: 'A full REST API with key auth. Embed a waitlist form on any site with a single snippet.',
  },
  {
    icon: Terminal,
    color: '255,107,157',
    title: 'Single binary + CLI',
    desc: 'Deploy anywhere with one binary. A built-in CLI handles users, backups, and restores.',
  },
]
