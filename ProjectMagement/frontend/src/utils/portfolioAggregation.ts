import type { PipelineStatus, Project } from '../types'

/** Column order aligned with pipeline stages (unknown statuses roll up to "other"). */
export const PIPELINE_STATUS_ORDER: readonly PipelineStatus[] = [
  'idea',
  'proposal',
  'planning',
  'approved',
  'active',
  'completed',
  'cancelled',
] as const

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus | 'other', string> = {
  idea: 'Idea',
  proposal: 'Proposal',
  planning: 'Planning',
  approved: 'Approved',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  other: 'Other',
}

const KNOWN = new Set<string>(PIPELINE_STATUS_ORDER)

export function normalizePortfolioStatus(status?: string | null): PipelineStatus | 'other' {
  const v = (status || 'planning').toLowerCase()
  if (KNOWN.has(v)) return v as PipelineStatus
  return 'other'
}

export function disciplineKey(project: Project): string {
  const t = project.type?.trim()
  return t || 'Uncategorized'
}

export interface PortfolioCell {
  count: number
  budget: number
}

export type PortfolioMatrix = Record<string, Record<PipelineStatus | 'other', PortfolioCell>>

export function buildDisciplineStatusMatrix(projects: Project[]): {
  disciplines: string[]
  matrix: PortfolioMatrix
  columnKeys: (PipelineStatus | 'other')[]
} {
  const emptyRow = (): Record<PipelineStatus | 'other', PortfolioCell> => {
    const row = {} as Record<PipelineStatus | 'other', PortfolioCell>
    for (const s of PIPELINE_STATUS_ORDER) row[s] = { count: 0, budget: 0 }
    row.other = { count: 0, budget: 0 }
    return row
  }

  const matrix: PortfolioMatrix = {}
  const disciplineSet = new Set<string>()

  for (const p of projects) {
    const d = disciplineKey(p)
    disciplineSet.add(d)
    if (!matrix[d]) matrix[d] = emptyRow()
    const col = normalizePortfolioStatus(p.status)
    const cell = matrix[d][col]
    cell.count += 1
    cell.budget += Number(p.budget) || 0
  }

  const disciplines = [...disciplineSet].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  const otherCount = disciplines.reduce((n, d) => n + matrix[d].other.count, 0)
  const columnKeys: (PipelineStatus | 'other')[] =
    otherCount > 0 ? [...PIPELINE_STATUS_ORDER, 'other'] : [...PIPELINE_STATUS_ORDER]

  return { disciplines, matrix, columnKeys }
}

export function sumCell(a: PortfolioCell, b: PortfolioCell): PortfolioCell {
  return { count: a.count + b.count, budget: a.budget + b.budget }
}

export function rowTotal(matrix: PortfolioMatrix, discipline: string, columnKeys: (PipelineStatus | 'other')[]): PortfolioCell {
  const row = matrix[discipline]
  if (!row) return { count: 0, budget: 0 }
  return columnKeys.reduce((acc, k) => sumCell(acc, row[k]), { count: 0, budget: 0 })
}

export function columnTotal(matrix: PortfolioMatrix, disciplines: string[], status: PipelineStatus | 'other'): PortfolioCell {
  return disciplines.reduce((acc, d) => sumCell(acc, matrix[d][status]), { count: 0, budget: 0 })
}

export function grandTotal(matrix: PortfolioMatrix, disciplines: string[], columnKeys: (PipelineStatus | 'other')[]): PortfolioCell {
  return disciplines.reduce((acc, d) => sumCell(acc, rowTotal(matrix, d, columnKeys)), { count: 0, budget: 0 })
}

export function formatPortfolioBudget(n: number): string {
  const x = Number(n) || 0
  if (x >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(2)}B`
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(1)}M`
  if (x >= 1_000) return `$${(x / 1_000).toFixed(0)}K`
  return `$${x.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}
