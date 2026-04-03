import axios from 'axios'

/**
 * Base URL for REST calls. Paths in this app are like `/images`, `/auth/login` (no second `/api` prefix).
 * - Relative `/api` uses the Vite dev proxy.
 * - If `VITE_API_URL` is `http://host:port` without `/api`, Spring routes (`/api/images/...`) would 404 — append `/api`.
 */
function normalizeApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
  if (raw === '/api') return '/api'
  if (/^https?:\/\//i.test(raw) && !raw.endsWith('/api')) {
    return `${raw}/api`
  }
  return raw
}

const API_BASE = normalizeApiBase()

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
