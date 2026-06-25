import { createFileRoute, Link } from '@tanstack/react-router'
import { Shield, ArrowLeft, Mail, Globe, Lock, Database, UserCheck, Trash2, Home } from 'lucide-react'

export const Route = createFileRoute('/privacy-policy')({
  component: PrivacyPolicyPage,
})

const SECTIONS = [
  {
    id: 'what-we-collect',
    icon: <Database size={18} color="#818cf8" />,
    title: 'What we collect',
    content: [
      'When you sign up for a waitlist, we collect your email address and, optionally, your name.',
      'We also record the IP address, signup source (form, widget, or API), and a timestamp — used for analytics and abuse prevention.',
      'If the project has custom form fields enabled, the data you provide in those fields is stored alongside your subscription.',
    ],
  },
  {
    id: 'how-we-use-data',
    icon: <Globe size={18} color="#4ade80" />,
    title: 'How we use your data',
    content: [
      'Your email is used to notify you about the waitlist you signed up for — welcome emails, launch announcements, and updates from the project owner.',
      'Analytics data (page views, signups) gives the project owner aggregate statistics only. We never sell or share your personal data with third parties.',
      'IP addresses are used for rate limiting and abuse prevention, and nothing else.',
    ],
  },
  {
    id: 'email-communications',
    icon: <Mail size={18} color="#facc15" />,
    title: 'Email communications',
    content: [
      "Emails are sent through the project owner's own SMTP configuration — Waitless does not operate a shared email service.",
      'Every email includes a one-click unsubscribe link. Unsubscribe at any time and your status updates immediately.',
      'We comply with CAN-SPAM and include List-Unsubscribe headers in all outbound email.',
    ],
  },
  {
    id: 'data-security',
    icon: <Lock size={18} color="#ff6b9d" />,
    title: 'Data security',
    content: [
      'All SMTP passwords are encrypted at rest using AES-256-GCM.',
      'User passwords are hashed with bcrypt at a cost factor of 12.',
      'Sessions are server-side with secure, HttpOnly cookies, capped at 5 concurrent sessions per account.',
      'Input validation and XSS protection are applied to all user-submitted data.',
    ],
  },
  {
    id: 'your-rights',
    icon: <UserCheck size={18} color="#c084fc" />,
    title: 'Your rights',
    content: [
      'You can unsubscribe from any waitlist at any time using the link in any email.',
      'You can request deletion of your account and all associated data by contacting the platform administrator.',
      'Project owners can export subscriber data and are responsible for handling requests from their subscribers.',
    ],
  },
  {
    id: 'data-retention',
    icon: <Trash2 size={18} color="#f87171" />,
    title: 'Data retention',
    content: [
      'Subscriber data is retained as long as the associated project exists.',
      'Expired sessions are automatically cleaned up every 6 hours.',
      'When a project is deleted, all associated subscribers, email logs, analytics records, and API keys are permanently removed.',
    ],
  },
]

function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top nav */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px clamp(16px, 5vw, 40px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: 'rgba(14,12,18,0.78)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #c084fc, #ff6b9d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Waitless</span>
        </Link>
        <Link
          to="/"
          className="btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
      </nav>

      {/* Content */}
      <div
        className="fade-in-up"
        style={{ maxWidth: 720, margin: '0 auto', padding: '128px clamp(16px, 5vw, 24px) 80px' }}
      >
        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(192,132,252,0.12)',
              border: '1px solid rgba(192,132,252,0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#818cf8',
            }}
          >
            <Lock size={12} /> Privacy &amp; data protection
          </div>
          <h1
            className="gradient-text"
            style={{ fontSize: 'clamp(32px, 7vw, 44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.1 }}
          >
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.7, margin: '0 0 14px', maxWidth: 620 }}>
            How Waitless handles the data you and your subscribers entrust to it. Plain language, no surprises.
          </p>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: 0 }}>Last updated: March 2026</p>
        </header>

        {/* Quick navigation */}
        <nav
          aria-label="Sections"
          className="card"
          style={{ padding: 20, marginBottom: 32 }}
        >
          <p
            className="field-label"
            style={{ margin: '0 0 12px' }}
          >
            On this page
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="badge badge-gray"
                style={{ textDecoration: 'none' }}
              >
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SECTIONS.map((s) => (
            <PolicySection key={s.id} id={s.id} icon={s.icon} title={s.title} content={s.content} />
          ))}
        </div>

        {/* Self-hosted notice */}
        <section
          className="card"
          style={{
            padding: 28,
            marginTop: 32,
            background:
              'linear-gradient(135deg, rgba(192,132,252,0.1) 0%, rgba(255,107,157,0.05) 100%)',
            border: '1px solid rgba(192,132,252,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="icon-tile" aria-hidden="true">
              <Home size={18} color="#c084fc" />
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Self-hosted notice</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.75 }}>
            Waitless is an open-source, self-hosted platform. The operator of this instance is responsible for
            compliance with applicable privacy regulations (GDPR, CCPA, and others). This document is a template —
            instance operators should tailor it to reflect their specific data-handling practices.
          </p>
        </section>

        {/* Contact / footer */}
        <footer
          style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p style={{ color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>
            Questions about your data? Reach out to the platform administrator or the project owner directly.
          </p>
          <Link
            to="/"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back to Waitless
          </Link>
        </footer>
      </div>
    </div>
  )
}

function PolicySection({
  id,
  icon,
  title,
  content,
}: {
  id: string
  icon: React.ReactNode
  title: string
  content: string[]
}) {
  return (
    <section id={id} className="card" style={{ padding: 28, scrollMarginTop: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="icon-tile" aria-hidden="true">
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {content.map((p, i) => (
          <p key={i} style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.75 }}>
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
