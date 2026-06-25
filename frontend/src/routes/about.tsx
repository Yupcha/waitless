import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Sparkles,
  ArrowRight,
  Mail,
  Zap,
  ShieldCheck,
  Heart,
} from 'lucide-react'

const Github = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

export const Route = createFileRoute('/about')({
  component: About,
})

const PILLARS = [
  {
    icon: Mail,
    title: 'Capture every signup',
    body: 'Drop-in waitlist widgets and a clean API so no early fan ever slips through the cracks.',
  },
  {
    icon: Zap,
    title: 'Built to move fast',
    body: 'Type-safe routing, server functions, and modern SSR defaults — ship features instead of plumbing.',
  },
  {
    icon: ShieldCheck,
    title: 'Open and yours',
    body: 'Self-host it, read every line, bend it to your stack. No lock-in, no surprises.',
  },
]

function About() {
  return (
    <main className="relative overflow-hidden px-4 py-16 sm:py-24">
      {/* Ambient floating orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute -top-24 left-[8%] h-72 w-72 rounded-full blur-3xl"
          style={{
            background: 'rgba(192,132,252,0.18)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-32 right-[6%] h-80 w-80 rounded-full blur-3xl"
          style={{
            background: 'rgba(255,107,157,0.14)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: 'rgba(129,140,248,0.12)',
            animation: 'float 9s ease-in-out infinite',
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <section className="fade-in-up text-center">
          <span
            className="badge badge-purple inline-flex items-center gap-1.5"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Open-source waitlist tooling
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            <span className="gradient-text-brand">Waitless</span>
            <span className="block text-[var(--ink)]">
              turns interest into momentum.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
            Waitless is a small, sharp foundation for building launch
            waitlists — collect signups, run promos, and grow an audience
            before day one. Built on type-safe routing and modern SSR, it
            stays out of your way so you can ship.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              Explore Waitless
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Github className="h-4 w-4" aria-hidden />
              Star on GitHub
            </a>
          </div>
        </section>

        {/* Pillars */}
        <section className="stagger mt-20 grid gap-5 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card-glow h-full p-6">
              <div className="icon-tile mb-4">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="text-base font-semibold text-[var(--ink)]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                {body}
              </p>
            </article>
          ))}
        </section>

        {/* Mission */}
        <section className="card fade-in mt-12 p-7 sm:p-10">
          <h2 className="text-xl font-semibold text-[var(--ink)] sm:text-2xl">
            Our small mission
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
            Great products deserve a great start. Waitless gives founders and
            indie makers a clean, hackable starting point — pre-launch signup
            capture without the bloat. Use it as-is, or treat it as a base and
            layer in your own routes, styling, and integrations.
          </p>
        </section>

        {/* CTA band */}
        <section
          className="card-glow mt-12 flex flex-col items-center gap-4 p-8 text-center sm:p-10"
        >
          <Heart className="h-6 w-6 text-[var(--ink)]" style={{ color: '#ff6b9d' }} aria-hidden />
          <h2 className="text-2xl font-bold text-[var(--ink)] sm:text-3xl">
            Ready to build your waitlist?
          </h2>
          <p className="max-w-xl text-sm leading-7 text-[var(--ink-muted)]">
            Spin up a project in minutes and start collecting signups today.
          </p>
          <Link
            to="/"
            className="btn-primary mt-2 inline-flex items-center gap-2"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </main>
  )
}
