/** Read JWT claims from localStorage token (no verification; for client-side audit metadata only). */
export function getJwtClaims(): { sub?: string; name?: string; email?: string } {
  const t = localStorage.getItem('token')
  if (!t?.includes('.')) return {}
  try {
    const payload = JSON.parse(atob(t.split('.')[1])) as Record<string, unknown>
    return {
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    }
  } catch {
    return {}
  }
}
