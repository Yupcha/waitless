import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { widgetApi } from '@/lib/api'
import { Copy, Code2, Globe, SquareCode, Link2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/dashboard/projects/$id/widget')({
  component: WidgetPage,
})

function WidgetPage() {
  const { id } = Route.useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['widget', id],
    queryFn: () => widgetApi.get(id).then(r => r.data),
  })

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  const CodeBlock = ({
    icon,
    label,
    code,
    hint,
    accent,
  }: {
    icon: React.ReactNode
    label: string
    code: string
    hint?: string
    accent: string
  }) => (
    <section className="card-glow fade-in-up" style={{ padding: 24, marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: hint ? 6 : 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span
            className="icon-tile"
            style={{
              width: 40,
              height: 40,
              background: `${accent}1a`,
              borderColor: `${accent}33`,
              color: accent,
            }}
          >
            {icon}
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {label}
          </h3>
        </div>
        <button
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
          onClick={() => copy(code)}
          aria-label={`Copy ${label} snippet`}
        >
          <Copy size={14} /> Copy
        </button>
      </div>
      {hint && (
        <p className="help-text" style={{ margin: '0 0 14px', maxWidth: '60ch' }}>
          {hint}
        </p>
      )}
      <pre
        style={{
          margin: 0,
          padding: 16,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 'var(--radius-md)',
          overflowX: 'auto',
          fontSize: 13,
          color: '#a5b4fc',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          lineHeight: 1.65,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <code>{code}</code>
      </pre>
    </section>
  )

  return (
    <div style={{ maxWidth: 760 }}>
      <header style={{ marginBottom: 28 }}>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
          }}
        >
          Embed your <span className="gradient-text-brand">waitlist</span>
        </h2>
        <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: '60ch' }}>
          Drop the signup form onto any site in seconds. Pick the embed that fits your stack, or share the
          hosted page directly.
        </p>
      </header>

      {isError ? (
        <div
          className="card"
          style={{
            padding: 48,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            className="icon-tile"
            style={{ background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.22)', color: '#f87171' }}
          >
            <AlertTriangle size={20} />
          </span>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
              Couldn&apos;t load your embed code
            </h3>
            <p className="help-text" style={{ margin: 0 }}>
              Something went wrong fetching the widget. Refresh the page to try again.
            </p>
          </div>
        </div>
      ) : isLoading || !data ? (
        <div className="stagger">
          {[0, 1].map(i => (
            <div key={i} className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)' }} />
                <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 6 }} />
              </div>
              <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 6, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: '100%', height: 86, borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="stagger">
          <CodeBlock
            icon={<Code2 size={18} />}
            accent="#c084fc"
            label="JavaScript widget"
            hint="Recommended. Paste this just before your closing </body> tag — the form renders inline inside the container div."
            code={data.widget_snippet}
          />
          <CodeBlock
            icon={<SquareCode size={18} />}
            accent="#818cf8"
            label="iFrame embed"
            hint="A self-contained, isolated alternative when you'd rather not run any script on your page."
            code={data.iframe_snippet}
          />

          {/* Direct url */}
          <section className="card-glow fade-in-up" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span
                className="icon-tile"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255,107,157,0.1)',
                  borderColor: 'rgba(255,107,157,0.22)',
                  color: '#ff6b9d',
                }}
              >
                <Globe size={18} />
              </span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                Hosted waitlist page
              </h3>
            </div>
            <p className="help-text" style={{ margin: '0 0 14px', maxWidth: '60ch' }}>
              No code at all — share this link anywhere and collect signups on our hosted page.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <code className="copy-box" style={{ flex: '1 1 220px', color: '#818cf8' }}>
                <Link2 size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                /w/{data.slug}
              </code>
              <button
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => copy(window.location.origin + '/w/' + data.slug)}
                aria-label="Copy hosted waitlist URL"
              >
                <Copy size={14} /> Copy URL
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
