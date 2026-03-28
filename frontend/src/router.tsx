import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16,
        }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, margin: 0, color: '#e2e8f0' }}>404</h1>
          <p style={{ color: '#64748b', fontSize: 16, margin: 0 }}>Page not found</p>
          <a href="/" style={{
            color: '#818cf8', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            padding: '10px 20px', borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.1)',
          }}>
            Go home
          </a>
        </div>
      )
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
