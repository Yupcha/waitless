import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import {
  FolderOpen,
  Plus,
  Users,
  TrendingUp,
  ArrowUpRight,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

const GRID_PROJECTS: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
  gap: 18,
}

const GRID_STATS: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
  gap: 16,
  marginBottom: 36,
}

function SkeletonStatCard() {
  return (
    <div className="stat-card" style={{ minHeight: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 100, height: 13, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
      </div>
      <div className="skeleton" style={{ width: 56, height: 34, borderRadius: 8 }} />
    </div>
  )
}

function SkeletonProjectCard() {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 100 }} />
      </div>
      <div className="skeleton" style={{ width: '55%', height: 16, borderRadius: 6, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: '32%', height: 12, borderRadius: 6, marginBottom: 22 }} />
      <div className="skeleton" style={{ width: '70%', height: 11, borderRadius: 6 }} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tint,
  ring,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tint: string
  ring: string
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 500 }}>{label}</span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: tint,
            border: `1px solid ${ring}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function DashboardOverview() {
  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const totalProjects = projects.length
  const activeProjects = projects.filter((p: any) => p.status === 'active').length
  const pausedProjects = projects.filter((p: any) => p.status === 'paused').length

  return (
    <div className="fade-in" style={{ maxWidth: 1180 }}>
      {/* Header */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Overview</div>
          <div className="topbar-subtitle">Your waitlists at a glance — track status and jump back in.</div>
        </div>
        <Link
          to="/dashboard/projects/new"
          className="btn-primary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px' }}
        >
          <Plus size={16} /> New project
        </Link>
      </div>

      {/* Stats */}
      <div style={GRID_STATS}>
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              label="Total projects"
              value={totalProjects}
              tint="rgba(129,140,248,0.1)"
              ring="rgba(129,140,248,0.18)"
              icon={<Layers size={17} color="#818cf8" />}
            />
            <StatCard
              label="Active"
              value={activeProjects}
              tint="rgba(34,197,94,0.1)"
              ring="rgba(34,197,94,0.18)"
              icon={<TrendingUp size={17} color="#4ade80" />}
            />
            <StatCard
              label="Paused"
              value={pausedProjects}
              tint="rgba(234,179,8,0.1)"
              ring="rgba(234,179,8,0.18)"
              icon={<FolderOpen size={17} color="#facc15" />}
            />
          </>
        )}
      </div>

      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Projects</h2>
        {!isLoading && !isError && totalProjects > 0 && (
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
            {totalProjects} {totalProjects === 1 ? 'project' : 'projects'}
          </span>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div style={GRID_PROJECTS}>
          <SkeletonProjectCard />
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </div>
      ) : isError ? (
        <div
          className="card"
          style={{
            padding: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <AlertCircle size={28} color="#f87171" />
          </div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--ink)', fontWeight: 700 }}>Couldn&apos;t load projects</h3>
          <p style={{ margin: '0 0 24px', color: 'var(--ink-faint)', fontSize: 14, maxWidth: 320 }}>
            Something went wrong while fetching your projects. Please try again.
          </p>
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(192,132,252,0.14), rgba(255,107,157,0.12))',
              border: '1px solid rgba(192,132,252,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 22,
            }}
          >
            <FolderOpen size={30} color="#d8b4fe" />
          </div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--ink)', fontWeight: 700, fontSize: 18 }}>No projects yet</h3>
          <p style={{ margin: '0 0 28px', color: 'var(--ink-faint)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
            Spin up your first waitlist project and start collecting signups in minutes.
          </p>
          <Link
            to="/dashboard/projects/new"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <Plus size={16} /> Create your first project
          </Link>
        </div>
      ) : (
        <div className="stagger" style={GRID_PROJECTS}>
          {projects.map((p: any) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  const statusClass =
    project.status === 'active' ? 'badge-green' : project.status === 'paused' ? 'badge-yellow' : 'badge-gray'

  return (
    <Link to="/dashboard/projects/$id" params={{ id: project.id }} style={{ textDecoration: 'none' }}>
      <div className="card-glow" style={{ padding: 24, cursor: 'pointer', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: project.logo_url ? 'transparent' : 'linear-gradient(135deg, #c084fc, #ff6b9d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(192,132,252,0.22)',
              flexShrink: 0,
            }}
          >
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>
                {project.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <span className={`badge ${statusClass}`}>{project.status}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </h3>
          <ArrowUpRight size={15} color="var(--ink-faint)" style={{ flexShrink: 0 }} />
        </div>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 13,
            color: 'var(--ink-faint)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          /{project.slug}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            color: 'var(--ink-dim)',
            padding: '12px 0 0',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Users size={13} /> Created {formatDate(project.created_at)}
        </div>
      </div>
    </Link>
  )
}
