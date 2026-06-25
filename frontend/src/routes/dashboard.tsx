import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { Zap, FolderOpen, Settings, LogOut, Users, BarChart3, Shield, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

const SIDEBAR_WIDTH = 264

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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c084fc 50%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(192,132,252,0.35)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            <Zap size={26} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="skeleton" style={{ width: 132, height: 12, borderRadius: 8 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.02em' }}>
              Loading your workspace…
            </span>
          </div>
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
      window.location.href = '/login'
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
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 200,
            width: 42,
            height: 42,
            borderRadius: 12,
            background: sidebarOpen ? 'rgba(192,132,252,0.18)' : 'rgba(28,22,38,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f5f3f7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 149,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <aside
          className={isMobile ? 'slide-in-left' : undefined}
          style={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            background: isMobile
              ? 'rgba(14,12,18,0.98)'
              : 'linear-gradient(180deg, rgba(28,22,38,0.6) 0%, rgba(14,12,18,0.9) 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '72px 16px 24px' : '28px 16px',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            overflowY: 'auto',
            zIndex: isMobile ? 150 : 10,
            ...(isMobile ? { backdropFilter: 'blur(20px)' } : {}),
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              marginBottom: 32,
              textDecoration: 'none',
              padding: '0 14px',
            }}
          >
            <img
              src="/logo.png"
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                objectFit: 'cover',
                boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
                flexShrink: 0,
              }}
              alt="Waitless"
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 19,
                color: '#f5f3f7',
                letterSpacing: '-0.02em',
              }}
            >
              Waitless
            </span>
          </Link>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SectionLabel>Workspace</SectionLabel>
            <NavLink
              to="/dashboard"
              label="Projects"
              icon={<FolderOpen size={16} />}
              exact
              onClick={() => isMobile && setSidebarOpen(false)}
            />
            <NavLink
              to="/dashboard/settings"
              label="Settings"
              icon={<Settings size={16} />}
              onClick={() => isMobile && setSidebarOpen(false)}
            />

            {isAdmin && (
              <>
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.06)',
                    margin: '18px 14px',
                  }}
                />
                <SectionLabel>Admin</SectionLabel>
                <NavLink
                  to="/dashboard/admin"
                  label="Platform Stats"
                  icon={<BarChart3 size={16} />}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
                <NavLink
                  to="/dashboard/admin/users"
                  label="All Users"
                  icon={<Users size={16} />}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
                <NavLink
                  to="/dashboard/admin/projects"
                  label="All Projects"
                  icon={<Shield size={16} />}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
              </>
            )}
          </nav>

          {/* User */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #c084fc, #ff6b9d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(192,132,252,0.3)',
                }}
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#f5f3f7',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#6f6680',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-link"
              aria-label="Sign out of your account"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#6f6680',
                fontFamily: 'inherit',
              }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </aside>
      )}

      {/* Main */}
      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
          padding: isMobile ? '72px 16px 40px' : '32px 40px',
          minHeight: '100vh',
          width: isMobile ? '100%' : undefined,
          maxWidth: '100%',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#564f63',
        padding: '0 14px',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </div>
  )
}

function NavLink({
  to,
  label,
  icon,
  onClick,
  exact,
}: {
  to: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  exact?: boolean
}) {
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
