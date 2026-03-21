import type { Risk, RiskLevel } from '../types'

const SEVERITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 }

/** Uses open risks from the API when provided; otherwise falls back to project.riskLevel. */
export function getProjectRiskLevelFromRisks(
  risks: Risk[] | undefined,
  projectId: string,
  fallback?: RiskLevel
): RiskLevel {
  const openRisks = (risks || []).filter((r) => r.projectId === projectId && r.status !== 'closed')
  if (openRisks.length === 0) return fallback || 'low'
  const worst = openRisks.reduce((a, b) => (SEVERITY_ORDER[b.severity] > SEVERITY_ORDER[a.severity] ? b : a))
  const map: Record<string, RiskLevel> = { low: 'low', medium: 'medium', high: 'high', critical: 'high' }
  return map[worst.severity] || fallback || 'low'
}
