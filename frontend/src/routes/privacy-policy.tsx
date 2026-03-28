import { createFileRoute, Link } from '@tanstack/react-router'
import { Shield, ArrowLeft, Mail, Globe, Lock, Database, UserCheck, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/privacy-policy')({
  component: PrivacyPolicyPage,
})

function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,18,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#e2e8f0' }}>Waitless</span>
        </Link>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#94a3b8', textDecoration: 'none', fontSize: 14,
        }}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </nav>

      {/* Content */}
      <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 100, padding: '6px 14px', marginBottom: 20,
            fontSize: 13, color: '#818cf8',
          }}>
            <Lock size={12} /> Privacy & Data Protection
          </div>
          <h1 style={{
            fontSize: 42, fontWeight: 900, margin: '0 0 12px',
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Last updated: March 2026
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <PolicySection
            icon={<Database size={18} color="#818cf8" />}
            title="What we collect"
            content={[
              'When you sign up for a waitlist, we collect your email address and optionally your name.',
              'We also record the IP address, signup source (form, widget, or API), and timestamp for analytics and abuse prevention.',
              'If the project has custom form fields enabled, the data you provide in those fields is stored alongside your subscription.',
            ]}
          />

          <PolicySection
            icon={<Globe size={18} color="#4ade80" />}
            title="How we use your data"
            content={[
              'Your email is used to notify you about the waitlist you signed up for — such as welcome emails, launch announcements, and updates from the project owner.',
              'Analytics data (page views, signups) is used to provide the project owner with aggregate statistics. We do not sell or share your personal data with third parties.',
              'IP addresses are used for rate limiting and abuse prevention only.',
            ]}
          />

          <PolicySection
            icon={<Mail size={18} color="#f59e0b" />}
            title="Email communications"
            content={[
              'Emails are sent through the project owner\'s own SMTP configuration — Waitless does not operate a shared email service.',
              'Every email includes a one-click unsubscribe link. You can unsubscribe at any time and your status will be updated immediately.',
              'We comply with CAN-SPAM and include List-Unsubscribe headers in all outbound emails.',
            ]}
          />

          <PolicySection
            icon={<Lock size={18} color="#ef4444" />}
            title="Data security"
            content={[
              'All SMTP passwords are encrypted at rest using AES-256-GCM encryption.',
              'User passwords are hashed using bcrypt with a cost factor of 12.',
              'Sessions are server-side with secure, HttpOnly cookies. We enforce a maximum of 5 concurrent sessions per account.',
              'Input validation and XSS protection are applied to all user-submitted data.',
            ]}
          />

          <PolicySection
            icon={<UserCheck size={18} color="#8b5cf6" />}
            title="Your rights"
            content={[
              'You can unsubscribe from any waitlist at any time using the unsubscribe link in any email.',
              'You can request deletion of your account and all associated data by contacting the platform administrator.',
              'Project owners can export subscriber data and are responsible for handling data requests from their subscribers.',
            ]}
          />

          <PolicySection
            icon={<Trash2 size={18} color="#f87171" />}
            title="Data retention"
            content={[
              'Subscriber data is retained as long as the associated project exists.',
              'Expired sessions are automatically cleaned up every 6 hours.',
              'If a project is deleted, all associated subscribers, email logs, analytics records, and API keys are permanently removed.',
            ]}
          />
        </div>

        {/* Self-hosted notice */}
        <div className="card" style={{
          padding: 28, marginTop: 40,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            🏠 Self-Hosted Notice
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
            Waitless is an open-source, self-hosted platform. The operator of this instance is responsible for compliance
            with applicable privacy regulations (GDPR, CCPA, etc). This policy is a template — instance operators
            should customize it to reflect their specific data handling practices.
          </p>
        </div>

        {/* Contact */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Questions about your data? Contact the platform administrator or the project owner directly.
          </p>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <ArrowLeft size={14} /> Back to Waitless
          </Link>
        </div>
      </div>
    </div>
  )
}

function PolicySection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string[] }) {
  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {content.map((p, i) => (
          <p key={i} style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.75 }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}
