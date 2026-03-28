import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { widgetApi } from '@/lib/api'
import { Copy, Code2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/dashboard/projects/$id/widget')({
  component: WidgetPage,
})

function WidgetPage() {
  const { id } = Route.useParams()

  const { data } = useQuery({
    queryKey: ['widget', id],
    queryFn: () => widgetApi.get(id).then(r => r.data),
  })

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  const CodeBlock = ({ label, code, hint }: { label: string; code: string; hint?: string }) => (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={15} color="#818cf8" /> {label}
        </h3>
        <button className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => copy(code)}>
          <Copy size={13} /> Copy
        </button>
      </div>
      {hint && <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>{hint}</p>}
      <pre style={{
        margin: 0, padding: 16, background: 'rgba(0,0,0,0.4)',
        borderRadius: 10, overflow: 'auto', fontSize: 13,
        color: '#a5b4fc', fontFamily: 'monospace', lineHeight: 1.6,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {code}
      </pre>
    </div>
  )

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Embed Widget</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Add the waitlist form to any website using one of the methods below.
        </p>
      </div>

      {data ? (
        <>
          <CodeBlock
            label="JavaScript Widget (Recommended)"
            hint="Paste this before your closing </body> tag. The form renders inline in the container div."
            code={data.widget_snippet}
          />
          <CodeBlock
            label="iFrame Embed"
            hint="Use this for simpler embedding where you need an isolated iframe."
            code={data.iframe_snippet}
          />

          {/* Direct url */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
              Direct Waitlist URL
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
              Share this link directly with your audience.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <code style={{
                flex: 1, padding: '10px 14px',
                background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                fontSize: 14, color: '#818cf8', fontFamily: 'monospace',
              }}>
                /w/{data.slug}
              </code>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => copy(window.location.origin + '/w/' + data.slug)}>
                <Copy size={13} /> Copy URL
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 60 }}>Loading widget code...</div>
      )}
    </div>
  )
}
