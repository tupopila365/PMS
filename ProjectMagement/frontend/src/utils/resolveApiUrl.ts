/** Build absolute or same-origin URL for API file paths (works with Vite proxy when base is empty). */
export function resolveApiUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}
