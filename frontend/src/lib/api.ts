import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      const path = window.location.pathname
      // Don't redirect if already on auth pages or if it's a /me check
      const isAuthPage = path === '/login' || path === '/register' || path === '/reset-password'
      const isMeCheck = url.includes('/auth/me')
      if (!isAuthPage && !isMeCheck) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}

// Projects
export const projectsApi = {
  list: () => api.get('/dashboard/projects'),
  create: (data: any) => api.post('/dashboard/projects', data),
  get: (id: string) => api.get(`/dashboard/projects/${id}`),
  update: (id: string, data: any) => api.put(`/dashboard/projects/${id}`, data),
  delete: (id: string, password?: string) => api.delete(`/dashboard/projects/${id}`, { data: { password } }),
  recover: (id: string) => api.post(`/dashboard/projects/${id}/recover`),
  stats: (id: string) => api.get(`/dashboard/projects/${id}/stats`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/dashboard/projects/${id}/status`, { status }),
}

// Subscribers
export const subscribersApi = {
  list: (projectId: string, params?: any) =>
    api.get(`/dashboard/projects/${projectId}/subscribers`, { params }),
  export: (projectId: string) =>
    `/api/dashboard/projects/${projectId}/subscribers/export`,
  delete: (projectId: string, subId: string, permanent?: boolean) =>
    api.delete(`/dashboard/projects/${projectId}/subscribers/${subId}${permanent ? '?permanent=true' : ''}`),
  updateStatus: (projectId: string, subId: string, status: string) =>
    api.patch(`/dashboard/projects/${projectId}/subscribers/${subId}/status`, { status }),
  bulk: (projectId: string, action: string, ids: string[]) =>
    api.post(`/dashboard/projects/${projectId}/subscribers/bulk`, { action, ids }),
}

// SMTP
export const smtpApi = {
  get: (projectId: string) => api.get(`/dashboard/projects/${projectId}/smtp`),
  save: (projectId: string, data: any) =>
    api.put(`/dashboard/projects/${projectId}/smtp`, data),
  test: (projectId: string) =>
    api.post(`/dashboard/projects/${projectId}/smtp/test`),
  gmailConnect: (projectId: string) =>
    api.get(`/dashboard/projects/${projectId}/oauth/gmail/connect`),
  gmailDisconnect: (projectId: string) =>
    api.delete(`/dashboard/projects/${projectId}/oauth/gmail/disconnect`),
  zohoConnect: (projectId: string) =>
    api.get(`/dashboard/projects/${projectId}/oauth/zoho/connect`),
  zohoExchange: (projectId: string, code: string, email: string) =>
    api.post(`/dashboard/projects/${projectId}/oauth/zoho/exchange`, { code, email }),
  zohoSetEmail: (projectId: string, email: string) =>
    api.put(`/dashboard/projects/${projectId}/oauth/zoho/email`, { email }),
  zohoDisconnect: (projectId: string) =>
    api.delete(`/dashboard/projects/${projectId}/oauth/zoho/disconnect`),
}

// API Keys
export const apiKeysApi = {
  list: (projectId: string) => api.get(`/dashboard/projects/${projectId}/keys`),
  create: (projectId: string, name: string) =>
    api.post(`/dashboard/projects/${projectId}/keys`, { name }),
  delete: (projectId: string, keyId: string) =>
    api.delete(`/dashboard/projects/${projectId}/keys/${keyId}`),
}

// Widget
export const widgetApi = {
  get: (projectId: string) => api.get(`/dashboard/projects/${projectId}/widget`),
}

// Admin
export const adminApi = {
  users: () => api.get('/admin/users'),
  projects: () => api.get('/admin/projects'),
  stats: () => api.get('/admin/stats'),
}

// Public
export const publicApi = {
  getProject: (slug: string) => api.get(`/public/w/${slug}`),
  subscribe: (slug: string, data: { email: string; name: string }) =>
    api.post(`/public/w/${slug}/subscribe`, data),
}

export default api
