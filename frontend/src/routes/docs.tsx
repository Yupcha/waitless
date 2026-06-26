import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Book, Terminal, Code2, Key, Globe, Copy, Check, Menu, X, ArrowLeft, ArrowUpRight, Info, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

const Github = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const sections = [
  { id: 'overview', label: 'Overview', icon: Book },
  { id: 'public-api', label: 'Public API', icon: Globe },
  { id: 'rest-api', label: 'REST API v1', icon: Key },
  { id: 'dashboard-api', label: 'Dashboard API', icon: Code2 },
  { id: 'cli', label: 'CLI Tools', icon: Terminal },
]

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = () => {
    navigator.clipboard.writeText(children.trim())
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="docs-code" style={{ position: 'relative', marginBottom: 18 }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--ink-faint)', padding: '0 2px 7px',
        }}>{label}</div>
      )}
      <pre style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-md)', padding: '18px 20px', overflowX: 'auto',
        fontSize: 13, lineHeight: 1.65,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
        color: '#d6d0e0', margin: 0,
      }}>
        {children.trim()}
      </pre>
      <button
        onClick={copy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        title={copied ? 'Copied' : 'Copy'}
        style={{
          position: 'absolute', top: label ? 30 : 10, right: 10,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px',
          cursor: 'pointer', color: copied ? '#4ade80' : 'var(--ink-muted)',
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
          transition: 'all 0.15s',
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{
      overflowX: 'auto', marginBottom: 18,
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-md)',
    }}>
      <table className="data-table">
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} dangerouslySetInnerHTML={{ __html: c }} />)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function H2({ id, eyebrow, children }: { id?: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: '64px 0 18px', scrollMarginTop: 80 }} id={id}>
      {eyebrow && (
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: 8,
        }} className="gradient-text-brand">{eyebrow}</div>
      )}
      <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
        {children}
      </h2>
    </div>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '32px 0 12px', letterSpacing: '-0.01em' }}>{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>{children}</p>
}

function Callout({ type, children }: { type: 'info' | 'warning'; children: React.ReactNode }) {
  const warning = type === 'warning'
  const rgb = warning ? '248,113,113' : '129,140,248'
  const Icon = warning ? AlertTriangle : Info
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: 18,
      fontSize: 14, lineHeight: 1.65,
      background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.2)`,
      color: 'var(--ink-soft)',
    }}>
      <Icon size={17} style={{ color: `rgb(${rgb})`, flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  )
}

function DocsPage() {
  const [active, setActive] = useState('overview')
  const [mobileNav, setMobileNav] = useState(false)

  const scrollTo = (id: string) => {
    setActive(id)
    setMobileNav(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '12px clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(14,12,18,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', height: 60,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" style={{
            width: 32, height: 32, borderRadius: 8, objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)', flexShrink: 0,
          }} alt="Waitless" />
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Waitless</span>
          <span style={{
            fontSize: 11, color: '#e9b8ff', marginLeft: 2, padding: '2px 8px',
            background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.2)',
            borderRadius: 'var(--radius-full)', fontWeight: 600, letterSpacing: '0.04em',
          }}>DOCS</span>
        </Link>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={15} /> <span className="docs-hide-sm">Home</span>
          </Link>
          <Link to="/login" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
        </div>
      </nav>

      <div style={{ display: 'flex', paddingTop: 60 }}>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setMobileNav(!mobileNav)}
          aria-label={mobileNav ? 'Close navigation' : 'Open navigation'}
          className="docs-mobile-toggle"
          style={{
            position: 'fixed', top: 72, left: 14, zIndex: 200, display: 'none',
            width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(28,22,38,0.95)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink)', cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)',
          }}
        >
          {mobileNav ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Mobile scrim */}
        {mobileNav && (
          <div
            onClick={() => setMobileNav(false)}
            className="docs-scrim"
            style={{
              position: 'fixed', inset: 0, top: 60, zIndex: 140,
              background: 'rgba(0,0,0,0.5)', display: 'none',
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          className={mobileNav ? 'docs-sidebar open' : 'docs-sidebar'}
          style={{
            width: 240, flexShrink: 0, position: 'fixed', top: 60, bottom: 0, left: 0, zIndex: 150,
            padding: '28px 16px', borderRight: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto', background: 'rgba(14,12,18,0.97)', backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--ink-dim)', textTransform: 'uppercase',
            letterSpacing: '0.1em', padding: '0 14px', marginBottom: 14,
          }}>
            Documentation
          </div>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={active === s.id ? 'sidebar-link active' : 'sidebar-link'}
              style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: active === s.id ? undefined : 'transparent' }}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}

          <div className="divider" style={{ margin: '20px 14px' }} />
          <a
            href="https://github.com/waitlss/waitless"
            target="_blank"
            rel="noreferrer"
            className="sidebar-link"
            style={{ textDecoration: 'none' }}
          >
            <Github size={16} /> GitHub
            <ArrowUpRight size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </a>
        </aside>

        {/* Content */}
        <main className="docs-main" style={{ flex: 1, marginLeft: 240, padding: '48px clamp(20px, 5vw, 56px)', maxWidth: 860, width: '100%' }}>
          {/* Overview */}
          <H2 id="overview" eyebrow="Get started">Waitless Documentation</H2>
          <P>
            Everything you need to integrate waitlists, manage subscribers, and automate growth.
            Waitless exposes three API layers plus a built-in CLI for administration.
          </P>
          <Table
            headers={['Layer', 'Auth', 'Use Case']}
            rows={[
              ['<strong>Public API</strong>', 'None (rate limited)', 'Waitlist signup forms, landing pages'],
              ['<strong>REST API v1</strong>', 'API Key (<code>Bearer</code>)', 'Server-side integrations, automations'],
              ['<strong>Dashboard API</strong>', 'Session cookie', 'Internal dashboard UI'],
              ['<strong>CLI Tools</strong>', 'Local access', 'User management, backups, password reset'],
            ]}
          />

          <H3>Quick Start</H3>
          <P>Subscribe someone to a waitlist, then list your subscribers with an API key.</P>
          <CodeBlock label="Terminal">{`# Subscribe someone to a waitlist
curl -X POST https://your-domain/api/public/w/my-project/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","name":"Jane","source":"api"}'

# List subscribers (API key auth)
curl https://your-domain/api/v1/projects/{id}/subscribers \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>

          {/* Public API */}
          <H2 id="public-api" eyebrow="No auth required">Public API</H2>
          <P>No authentication required. Rate limited to <strong style={{ color: 'var(--ink)' }}>20 requests/minute</strong> per IP.</P>

          <H3>Subscribe</H3>
          <CodeBlock label="Endpoint">{`POST /api/public/w/{slug}/subscribe
Content-Type: application/json`}</CodeBlock>
          <Table
            headers={['Field', 'Type', 'Required', 'Description']}
            rows={[
              ['<code>email</code>', 'string', '✅', 'Subscriber email'],
              ['<code>name</code>', 'string', '✅', 'Subscriber name'],
              ['<code>source</code>', 'string', '—', '<code>form</code>, <code>api</code>, or <code>widget</code>'],
              ['<code>promo</code>', 'string', '—', 'Promo campaign trigger code (e.g. <code>get5</code>)'],
              ['<code>custom_data</code>', 'object', '—', 'Responses to custom fields. Keys match the field <code>key</code> defined in project settings (e.g. <code>{"city":"NYC","plan":"Pro"}</code>)'],
            ]}
          />
          <CodeBlock label="Response · 201">{`{
  "message": "subscribed",
  "subscriber": {
    "id": "AbPjb8GbmjcJ",
    "email": "user@example.com",
    "status": "active",
    "country": "US"
  },
  "coupon": {
    "code": "EARLY-xK9mP2qr",
    "discount_type": "flat",
    "discount_value": 5.00,
    "currency": "USD",
    "expires_at": "2026-04-28T00:00:00Z"
  }
}`}</CodeBlock>
          <Callout type="info">
            The <strong>coupon</strong> field only appears if a matching promo campaign is configured for the project.
            The <strong>country</strong> field is populated asynchronously via IP geolocation.
          </Callout>
          <Table
            headers={['Code', 'Message']}
            rows={[
              ['<code>400</code>', 'Invalid email address'],
              ['<code>404</code>', 'Waitlist not found (bad slug or paused)'],
              ['<code>409</code>', 'Already subscribed'],
            ]}
          />

          <H3>Get Project</H3>
          <CodeBlock label="Endpoint">{`GET /api/public/w/{slug}`}</CodeBlock>
          <P>Returns public project info, subscriber count, and custom field definitions for rendering landing pages.</P>

          <H3>Unsubscribe</H3>
          <CodeBlock label="Endpoint">{`GET /api/public/unsubscribe?token={unsubscribe_token}`}</CodeBlock>
          <P>Each subscriber has a unique token. Marks as unsubscribed, fires the webhook, and sends a Telegram notification (if configured).</P>

          {/* REST API */}
          <H2 id="rest-api" eyebrow="API key auth">REST API v1</H2>
          <P>Authenticated via API key. Rate limited to <strong style={{ color: 'var(--ink)' }}>100 requests/minute</strong> per IP.</P>

          <H3>Authentication</H3>
          <CodeBlock label="Header">{`Authorization: Bearer YOUR_API_KEY`}</CodeBlock>
          <P>API keys are created per-project in the dashboard under <strong style={{ color: 'var(--ink)' }}>Project → API Keys</strong>.</P>

          <H3>List Subscribers</H3>
          <CodeBlock label="Endpoint">{`GET /api/v1/projects/{projectId}/subscribers`}</CodeBlock>
          <Table
            headers={['Param', 'Default', 'Description']}
            rows={[
              ['<code>page</code>', '1', 'Page number'],
              ['<code>limit</code>', '20', 'Items per page (max 100)'],
              ['<code>status</code>', '—', '<code>active</code>, <code>pending</code>, <code>unsubscribed</code>'],
              ['<code>search</code>', '—', 'Search by name or email'],
              ['<code>sort</code>', '<code>created_at</code>', 'Sort column'],
              ['<code>order</code>', '<code>desc</code>', '<code>asc</code> or <code>desc</code>'],
            ]}
          />

          <H3>Add Subscriber</H3>
          <CodeBlock label="Endpoint">{`POST /api/v1/projects/{projectId}/subscribers
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Jane Doe"
}`}</CodeBlock>

          <H3>Subscriber Count</H3>
          <CodeBlock label="Endpoint">{`GET /api/v1/projects/{projectId}/count`}</CodeBlock>
          <CodeBlock label="Response">{`{ "count": 142 }`}</CodeBlock>

          <H3>Validate Coupon Code</H3>
          <CodeBlock label="Endpoint">{`GET /api/v1/projects/{projectId}/coupons/validate?code=EARLY-xK9mP2qr`}</CodeBlock>
          <P>Returns discount info, validity, and subscriber details for the given coupon code.</P>
          <CodeBlock label="Response">{`{
  "valid": true,
  "code": "EARLY-xK9mP2qr",
  "source_code": "get5",
  "status": "active",
  "discount_type": "flat",
  "discount_value": 5.00,
  "currency": "USD",
  "subscriber": { "id": "...", "email": "user@example.com" }
}`}</CodeBlock>

          <H3>Update Coupon Status</H3>
          <CodeBlock label="Endpoint">{`PATCH /api/v1/projects/{projectId}/coupons/{code}/status

{ "status": "used" }`}</CodeBlock>
          <P>
            Valid statuses: <code className="docs-pill">active</code>, <code className="docs-pill">used</code>, <code className="docs-pill">revoked</code>, <code className="docs-pill">expired</code>.
            Fires the <code className="docs-pill">coupon.redeemed</code> webhook when set to used.
          </P>

          <H3>Errors</H3>
          <Table
            headers={['Code', 'Meaning']}
            rows={[
              ['<code>401</code>', 'Invalid or missing API key'],
              ['<code>403</code>', "API key doesn't belong to this project"],
              ['<code>404</code>', 'Project not found'],
              ['<code>429</code>', 'Rate limit exceeded'],
            ]}
          />

          {/* Dashboard API */}
          <H2 id="dashboard-api" eyebrow="Session cookie auth">Dashboard API</H2>
          <Callout type="info">Internal use only. These endpoints require session-based authentication (cookie). Use the REST API v1 for programmatic access.</Callout>

          <H3>Auth Endpoints</H3>
          <Table headers={['Method', 'Endpoint', 'Description']} rows={[
            ['<code>POST</code>', '<code>/api/auth/register</code>', 'Create account'],
            ['<code>POST</code>', '<code>/api/auth/login</code>', 'Login'],
            ['<code>POST</code>', '<code>/api/auth/logout</code>', 'Logout'],
            ['<code>GET</code>', '<code>/api/auth/me</code>', 'Current user'],
            ['<code>POST</code>', '<code>/api/auth/forgot-password</code>', 'Send password reset email'],
            ['<code>POST</code>', '<code>/api/auth/reset-password</code>', 'Reset password with token'],
          ]} />

          <H3>Projects</H3>
          <Table headers={['Method', 'Endpoint', 'Description']} rows={[
            ['<code>GET</code>', '<code>/api/dashboard/projects</code>', "List user's projects"],
            ['<code>POST</code>', '<code>/api/dashboard/projects</code>', 'Create project'],
            ['<code>GET</code>', '<code>/api/dashboard/projects/{id}</code>', 'Get project'],
            ['<code>PUT</code>', '<code>/api/dashboard/projects/{id}</code>', 'Update project'],
            ['<code>DELETE</code>', '<code>/api/dashboard/projects/{id}</code>', 'Delete project'],
          ]} />

          <H3>Subscribers</H3>
          <Table headers={['Method', 'Endpoint', 'Description']} rows={[
            ['<code>GET</code>', '<code>.../subscribers</code>', 'List (paginated, searchable)'],
            ['<code>GET</code>', '<code>.../subscribers/export</code>', 'CSV export'],
            ['<code>POST</code>', '<code>.../subscribers/import</code>', 'CSV import'],
            ['<code>POST</code>', '<code>.../subscribers/bulk</code>', 'Bulk action'],
            ['<code>DELETE</code>', '<code>.../subscribers/{subId}</code>', 'Delete subscriber'],
          ]} />

          <H3>SMTP, Webhooks, Telegram, Coupons &amp; More</H3>
          <Table headers={['Method', 'Endpoint', 'Description']} rows={[
            ['<code>GET/PUT</code>', '<code>.../smtp</code>', 'SMTP config'],
            ['<code>POST</code>', '<code>.../smtp/test</code>', 'Test SMTP'],
            ['<code>GET/POST</code>', '<code>.../webhooks</code>', 'Webhooks'],
            ['<code>GET/POST</code>', '<code>.../api-keys</code>', 'API keys'],
            ['<code>GET</code>', '<code>.../emails</code>', 'Email logs'],
            ['<code>POST</code>', '<code>.../emails/broadcast</code>', 'Send broadcast'],
            ['<code>GET/POST/PUT/DELETE</code>', '<code>.../campaigns</code>', 'Promo campaigns CRUD'],
            ['<code>GET</code>', '<code>.../coupons</code>', 'List coupon codes'],
            ['<code>GET/PUT</code>', '<code>.../telegram</code>', 'Telegram notification config'],
            ['<code>POST</code>', '<code>.../telegram/test</code>', 'Send test Telegram message'],
          ]} />

          <H3>Admin (admin role only)</H3>
          <Table headers={['Method', 'Endpoint', 'Description']} rows={[
            ['<code>GET</code>', '<code>/api/admin/stats</code>', 'Platform stats'],
            ['<code>GET</code>', '<code>/api/admin/users</code>', 'All users'],
            ['<code>GET</code>', '<code>/api/admin/projects</code>', 'All projects'],
          ]} />

          {/* CLI */}
          <H2 id="cli" eyebrow="Local administration">CLI Tools</H2>
          <P>The Waitless binary includes built-in CLI commands for administration.</P>
          <CodeBlock label="Usage">{`./waitless <command> [args]`}</CodeBlock>
          <P>If no command is given, the HTTP server starts.</P>

          <H3>List Users</H3>
          <CodeBlock label="Terminal">{`./waitless users

ID            EMAIL              NAME         ROLE    CREATED
──            ─────              ────         ────    ───────
iVPcvDYolPQy  admin@example.com  Admin User   admin   2026-03-28
AbPjb8GbmjcJ  user@example.com   Regular User user    2026-03-28`}</CodeBlock>

          <H3>Reset Password</H3>
          <CodeBlock label="Terminal">{`./waitless reset-password <email>

User: Admin User (admin@example.com) [admin]
New password (min 8 chars): ********
✅ Password reset. All sessions invalidated.`}</CodeBlock>

          <H3>Database Backup</H3>
          <CodeBlock label="Terminal">{`./waitless backup <output-file.sql>

Backing up to backup.sql...
✅ Backup saved to backup.sql`}</CodeBlock>

          <H3>Database Restore</H3>
          <CodeBlock label="Terminal">{`./waitless restore <input-file.sql>

⚠️  This will overwrite the current database. Continue? [y/N]: y
✅ Database restored from backup.sql`}</CodeBlock>
          <Callout type="warning">Restore overwrites all existing data. Always back up first.</Callout>

          <H3>Environment</H3>
          <P>All CLI commands load <code className="docs-pill">.env</code> automatically. Required:</P>
          <Table headers={['Variable', 'Description']} rows={[
            ['<code>DATABASE_URL</code>', 'PostgreSQL connection string'],
            ['<code>ENCRYPTION_KEY</code>', 'For encrypted fields (SMTP passwords)'],
            ['<code>DISABLE_REGISTRATION</code>', 'Set to <code>true</code> to block new account signups'],
          ]} />

          {/* Footer */}
          <div style={{
            marginTop: 72, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 14, color: 'var(--ink-faint)', display: 'flex', flexWrap: 'wrap', gap: 8,
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>© {new Date().getFullYear()} Waitless · Built for builders.</span>
            <a
              href="https://github.com/waitlss/waitless"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--ink-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Github size={15} /> GitHub <ArrowUpRight size={13} />
            </a>
          </div>
        </main>
      </div>

      <style>{`
        .docs-main code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
          font-size: 0.9em;
        }
        .docs-main td code, .docs-main p code {
          background: rgba(255,255,255,0.06);
          padding: 2px 6px;
          border-radius: 5px;
          color: #e9b8ff;
        }
        .docs-pill {
          background: rgba(255,255,255,0.06);
          padding: 2px 6px;
          border-radius: 5px;
          color: #e9b8ff;
          font-size: 0.9em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        }
        @media (max-width: 768px) {
          .docs-mobile-toggle { display: flex !important; }
          .docs-main { margin-left: 0 !important; padding-top: 64px !important; }
          .docs-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .docs-sidebar.open { transform: translateX(0); }
          .docs-scrim { display: block !important; }
          .docs-hide-sm { display: none; }
        }
      `}</style>
    </div>
  )
}
