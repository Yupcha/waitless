import { createFileRoute, Outlet, Link, useNavigate, useMatches } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { Zap, FolderOpen, Settings, LogOut, Users, BarChart3, Shield, Menu, X, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.data),
    retry: false,
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}>
            <Zap size={24} color="white" />
          </div>
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 8 }} />
        </div>
      </div>
    )
  }

  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
      navigate({ to: '/login' })
    } catch {
      toast.error('Logout failed')
    }
  }

  const isAdmin = user.role === 'admin'
  const showSidebar = !isMobile || sidebarOpen

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 200,
            width: 40, height: 40, borderRadius: 10,
            background: sidebarOpen ? 'rgba(99,102,241,0.2)' : 'rgba(17,24,39,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.2s',
          }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 149,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <aside style={{
          width: 260, flexShrink: 0,
          background: isMobile ? 'rgba(11,15,26,0.98)' : 'linear-gradient(180deg, rgba(17,24,39,0.6) 0%, rgba(11,15,26,0.9) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          padding: isMobile ? '64px 16px 24px' : '28px 16px',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          overflowY: 'auto',
          zIndex: isMobile ? 150 : 10,
          transition: 'transform 0.25s ease',
          ...(isMobile ? { backdropFilter: 'blur(20px)' } : {}),
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, textDecoration: 'none', padding: '0 14px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              <Zap size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Waitless</span>
          </Link>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', padding: '0 14px', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Workspace
            </div>
            <NavLink to="/dashboard" label="Projects" icon={<FolderOpen size={16} />} exact onClick={() => isMobile && setSidebarOpen(false)} />
            <NavLink to="/dashboard/settings" label="Settings" icon={<Settings size={16} />} onClick={() => isMobile && setSidebarOpen(false)} />

            {isAdmin && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', padding: '0 14px', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Admin
                </div>
                <NavLink to="/dashboard/admin" label="Platform Stats" icon={<BarChart3 size={16} />} onClick={() => isMobile && setSidebarOpen(false)} />
                <NavLink to="/dashboard/admin/users" label="All Users" icon={<Users size={16} />} onClick={() => isMobile && setSidebarOpen(false)} />
                <NavLink to="/dashboard/admin/projects" label="All Projects" icon={<Shield size={16} />} onClick={() => isMobile && setSidebarOpen(false)} />
              </>
            )}
          </nav>

          {/* User */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="sidebar-link" style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              color: '#475569',
            }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </aside>
      )}

      {/* Main */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 260,
        padding: isMobile ? '64px 16px 32px' : '32px 40px',
        minHeight: '100vh',
        width: isMobile ? '100%' : undefined,
      }}>
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, label, icon, onClick, exact }: { to: string; label: string; icon: React.ReactNode; onClick?: () => void; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      activeProps={{ className: 'sidebar-link active' }}
      inactiveProps={{ className: 'sidebar-link' }}
      style={{ textDecoration: 'none' }}
      onClick={onClick}
    >
      {icon} {label}
    </Link>
  )
}
