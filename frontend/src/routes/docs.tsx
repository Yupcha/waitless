import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Zap, Book, Terminal, Code2, Key, Globe, Copy, Check, Menu, X } from 'lucide-react'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

const sections = [
  { id: 'overview', label: 'Overview', icon: Book },
  { id: 'public-api', label: 'Public API', icon: Globe },
  { id: 'rest-api', label: 'REST API v1', icon: Key },
  { id: 'dashboard-api', label: 'Dashboard API', icon: Code2 },
  { id: 'cli', label: 'CLI Tools', icon: Terminal },
]

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(children.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <pre style={{
        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '16px 18px', overflowX: 'auto',
        fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace', color: '#c9d1d9', margin: 0,
      }}>
        {children.trim()}
      </pre>
      <button onClick={copy} style={{
        position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 6px',
        cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center',
      }}>
        {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table className="data-table">
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} dangerouslySetInnerHTML={{ __html: c }} />)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: '48px 0 16px', letterSpacing: '-0.02em' }}>{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '28px 0 12px' }}>{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>{children}</p>
}

function Callout({ type, children }: { type: 'info' | 'warning'; children: React.ReactNode }) {
  const color = type === 'warning' ? '239,68,68' : '59,130,246'
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.6,
      background: `rgba(${color},0.06)`, border: `1px solid rgba(${color},0.15)`,
      color: `rgb(${color})`,
    }}>{children}</div>
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
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}><Zap size={17} color="white" /></div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Waitless</span>
          <span style={{ fontSize: 13, color: '#475569', marginLeft: 4 }}>Docs</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, padding: '7px 14px' }}>← Home</Link>
          <Link to="/login" className="btn-primary" style={{ padding: '7px 18px', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
        </div>
      </nav>

      <div style={{ display: 'flex', paddingTop: 60 }}>
        {/* Mobile toggle */}
        <button onClick={() => setMobileNav(!mobileNav)} style={{
          position: 'fixed', top: 70, left: 16, zIndex: 200, display: 'none',
          width: 36, height: 36, borderRadius: 8, background: 'rgba(17,24,39,0.9)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }} className="docs-mobile-toggle">
          {mobileNav ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0, position: 'fixed', top: 60, bottom: 0, left: 0,
          padding: '24px 16px', borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowY: 'auto', background: 'rgba(11,15,26,0.95)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 12 }}>
            Documentation
          </div>
          {sections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, textAlign: 'left', marginBottom: 2,
              background: active === s.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: active === s.id ? '#818cf8' : '#64748b',
              transition: 'all 0.15s',
            }}>
              <s.icon size={14} /> {s.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, marginLeft: 220, padding: '40px 48px', maxWidth: 800 }}>
          {/* Overview */}
          <H2 id="overview">Waitless Documentation</H2>
          <P>Waitless provides three API layers and a CLI for administration:</P>
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
          <CodeBlock>{`# Subscribe someone to a waitlist
curl -X POST https://your-domain/api/public/w/my-project/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","name":"Jane","source":"api"}'

# List subscribers (API key auth)
curl https://your-domain/api/v1/projects/{id}/subscribers \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>

          {/* Public API */}
          <H2 id="public-api">Public API</H2>
          <P>No authentication required. Rate limited to <strong style={{ color: '#e2e8f0' }}>20 requests/minute</strong> per IP.</P>

          <H3>Subscribe</H3>
          <CodeBlock>{`POST /api/public/w/{slug}/subscribe
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
          <CodeBlock>{`// Response 201
{
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
          <CodeBlock>{`GET /api/public/w/{slug}`}</CodeBlock>
          <P>Returns public project info, subscriber count, and custom field definitions for rendering landing pages.</P>

          <H3>Unsubscribe</H3>
          <CodeBlock>{`GET /api/public/unsubscribe?token={unsubscribe_token}`}</CodeBlock>
          <P>Each subscriber has a unique token. Marks as unsubscribed, fires the webhook, and sends a Telegram notification (if configured).</P>

          {/* REST API */}
          <H2 id="rest-api">REST API v1</H2>
          <P>Authenticated via API key. Rate limited to <strong style={{ color: '#e2e8f0' }}>100 requests/minute</strong> per IP.</P>

          <H3>Authentication</H3>
          <CodeBlock>{`Authorization: Bearer YOUR_API_KEY`}</CodeBlock>
          <P>API keys are created per-project in the dashboard under <strong style={{ color: '#e2e8f0' }}>Project → API Keys</strong>.</P>

          <H3>List Subscribers</H3>
          <CodeBlock>{`GET /api/v1/projects/{projectId}/subscribers`}</CodeBlock>
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
          <CodeBlock>{`POST /api/v1/projects/{projectId}/subscribers
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Jane Doe"
}`}</CodeBlock>

          <H3>Subscriber Count</H3>
          <CodeBlock>{`GET /api/v1/projects/{projectId}/count`}</CodeBlock>
          <CodeBlock>{`{ "count": 142 }`}</CodeBlock>

          <H3>Validate Coupon Code</H3>
          <CodeBlock>{`GET /api/v1/projects/{projectId}/coupons/validate?code=EARLY-xK9mP2qr`}</CodeBlock>
          <P>Returns discount info, validity, and subscriber details for the given coupon code.</P>
          <CodeBlock>{`{
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
          <CodeBlock>{`PATCH /api/v1/projects/{projectId}/coupons/{code}/status

{ "status": "used" }`}</CodeBlock>
          <P>Valid statuses: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>active</code>, <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>used</code>, <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>revoked</code>, <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>expired</code>. Fires <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>coupon.redeemed</code> webhook when set to used.</P>

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
          <H2 id="dashboard-api">Dashboard API</H2>
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

          <H3>SMTP, Webhooks, Telegram, Coupons & More</H3>
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
          <H2 id="cli">CLI Tools</H2>
          <P>The Waitless binary includes built-in CLI commands for administration.</P>
          <CodeBlock>{`./waitless <command> [args]`}</CodeBlock>
          <P>If no command is given, the HTTP server starts.</P>

          <H3>List Users</H3>
          <CodeBlock>{`./waitless users

ID            EMAIL              NAME         ROLE    CREATED
──            ─────              ────         ────    ───────
iVPcvDYolPQy  admin@example.com  Admin User   admin   2026-03-28
AbPjb8GbmjcJ  user@example.com   Regular User user    2026-03-28`}</CodeBlock>

          <H3>Reset Password</H3>
          <CodeBlock>{`./waitless reset-password <email>

User: Admin User (admin@example.com) [admin]
New password (min 8 chars): ********
✅ Password reset. All sessions invalidated.`}</CodeBlock>

          <H3>Database Backup</H3>
          <CodeBlock>{`./waitless backup <output-file.sql>

Backing up to backup.sql...
✅ Backup saved to backup.sql`}</CodeBlock>

          <H3>Database Restore</H3>
          <CodeBlock>{`./waitless restore <input-file.sql>

⚠️  This will overwrite the current database. Continue? [y/N]: y
✅ Database restored from backup.sql`}</CodeBlock>
          <Callout type="warning">Restore overwrites all existing data. Always backup first.</Callout>

          <H3>Environment</H3>
          <P>All CLI commands load <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>.env</code> automatically. Required:</P>
          <Table headers={['Variable', 'Description']} rows={[
            ['<code>DATABASE_URL</code>', 'PostgreSQL connection string'],
            ['<code>ENCRYPTION_KEY</code>', 'For encrypted fields (SMTP passwords)'],
            ['<code>DISABLE_REGISTRATION</code>', 'Set to <code>true</code> to block new account signups'],
          ]} />

          {/* Footer */}
          <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#334155' }}>
            © {new Date().getFullYear()} Waitless · <a href="https://github.com/waitlss/waitless" target="_blank" rel="noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>GitHub</a>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .docs-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
