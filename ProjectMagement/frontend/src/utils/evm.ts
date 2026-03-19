import type { Task, Project } from '../types'
import type { TimesheetEntry } from '../types'
import type { CostCategory } from '../types'

export interface EVMMetrics {
  bac: number
  pv: number
  ev: number
  ac: number
  cpi: number
  spi: number
  eac: number
  vac: number
  cv: number
  sv: number
  hoursLogged?: number
}

export function computeEVM(
  project: Project,
  tasks: Task[],
  options?: { timesheetEntries?: TimesheetEntry[]; costCategories?: CostCategory[] }
): EVMMetrics {
  const bac = project.budget || 0

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length

  const evPercentFromTasks = totalTasks > 0
    ? (completedTasks * 100 + inProgressTasks * 50) / totalTasks / 100
    : 0

  const timesheetEntries = options?.timesheetEntries?.filter((e) => e.projectId === project.id) || []
  const hoursLogged = timesheetEntries.reduce((s, e) => s + e.hours, 0)
  const estimatedHours = Math.max(totalTasks * 8, 1)
  const evPercentFromTimesheets = Math.min(1, hoursLogged / estimatedHours)
  const evPercent = timesheetEntries.length > 0
    ? (evPercentFromTasks + evPercentFromTimesheets) / 2
    : evPercentFromTasks
  const ev = bac * evPercent

  const costCategories = options?.costCategories?.filter((c) => c.projectId === project.id) || []
  const acFromCBS = costCategories.reduce((s, c) => s + c.actualCost, 0)
  const ac = acFromCBS > 0 ? acFromCBS : (project.actualCost || 0)

  const now = Date.now()
  const projectStart = project.plannedEndDate ? new Date(project.plannedEndDate).getTime() - 90 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000
  const projectEnd = project.plannedEndDate ? new Date(project.plannedEndDate).getTime() : now + 60 * 24 * 60 * 60 * 1000
  const elapsed = (now - projectStart) / (projectEnd - projectStart)
  const pv = Math.min(1, Math.max(0, elapsed)) * bac

  const cpi = ac > 0 ? ev / ac : 0
  const spi = pv > 0 ? ev / pv : 0
  const eac = cpi > 0 ? bac / cpi : bac
  const vac = bac - eac
  const cv = ev - ac
  const sv = ev - pv

  return { bac, pv, ev, ac, cpi, spi, eac, vac, cv, sv, hoursLogged: hoursLogged || undefined }
}
