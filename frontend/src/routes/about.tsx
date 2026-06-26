import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Sparkles,
  ArrowRight,
  Mail,
  Zap,
  ShieldCheck,
  Heart,
} from 'lucide-react'
import { GithubIcon } from '@/components/icons'

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
              <GithubIcon className="h-4 w-4" aria-hidden />
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
