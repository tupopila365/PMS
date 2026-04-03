/**
 * Build absolute or same-origin URL for API file paths (works with Vite proxy when base is empty).
 * When VITE_API_URL is like `http://host:port/api` and path is `/api/images/...`, avoid `/api/api/...` (404, broken thumbnails).
 */
export function resolveApiUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''
  let p = path.startsWith('/') ? path : `/${path}`
  if (base && base.endsWith('/api') && p.startsWith('/api/')) {
    p = p.slice(4) // → /images/file/... relative to API root
  }
  return base ? `${base}${p}` : p
}
