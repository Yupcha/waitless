import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import '../styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  )
}
