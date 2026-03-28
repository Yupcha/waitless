import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { FolderOpen, Plus, Users, TrendingUp, ArrowUpRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

function SkeletonStatCard() {
  return (
    <div className="stat-card" style={{ minHeight: 110 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 36, borderRadius: 8 }} />
    </div>
  )
}

function SkeletonProjectCard() {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 56, height: 22, borderRadius: 100 }} />
      </div>
      <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '30%', height: 12, borderRadius: 6 }} />
    </div>
  )
}

function DashboardOverview() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const totalProjects = projects.length
  const activeProjects = projects.filter((p: any) => p.status === 'active').length

  return (
    <div className="fade-in">
      {/* Top bar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Overview</div>
          <div className="topbar-subtitle">Manage your waitlist projects</div>
        </div>
        <Link to="/dashboard/projects/new" className="btn-primary" style={{
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
        }}>
          <Plus size={15} /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Total Projects</span>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FolderOpen size={16} color="#818cf8" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>{totalProjects}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Active</span>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={16} color="#4ade80" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>{activeProjects}</div>
            </div>
          </>
        )}
      </div>

      {/* Projects */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          <SkeletonProjectCard />
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <FolderOpen size={28} color="#475569" />
          </div>
          <h3 style={{ margin: '0 0 8px', color: '#e2e8f0', fontWeight: 700 }}>No projects yet</h3>
          <p style={{ margin: '0 0 28px', color: '#475569', fontSize: 14, maxWidth: 300 }}>Create your first waitlist project to start collecting signups.</p>
          <Link to="/dashboard/projects/new" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Create project
          </Link>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {projects.map((p: any) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Link to="/dashboard/projects/$id" params={{ id: project.id }} style={{ textDecoration: 'none' }}>
      <div className="card-glow" style={{ padding: 24, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: project.logo_url ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
          }}>
            {project.logo_url
              ? <img src={project.logo_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>{project.name[0]}</span>
            }
          </div>
          <span className={`badge ${project.status === 'active' ? 'badge-green' : project.status === 'paused' ? 'badge-yellow' : 'badge-gray'}`}>
            {project.status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{project.name}</h3>
          <ArrowUpRight size={14} color="#475569" />
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569' }}>/{project.slug}</p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: '#334155',
          padding: '8px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <Users size={12} /> Created {formatDate(project.created_at)}
        </div>
      </div>
    </Link>
  )
}
