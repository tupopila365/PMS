import type { Task } from '../types'

export interface TaskWithSchedule extends Task {
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
  isCritical: boolean
}

function parseDate(d: string | undefined): number {
  if (!d) return 0
  return new Date(d).getTime()
}

export function computeCriticalPath(tasks: Task[]): TaskWithSchedule[] {
  const durationMap = new Map<string, number>()
  for (const t of tasks) {
    const duration = t.duration ?? 1
    const start = t.startDate ? parseDate(t.startDate) : parseDate(t.dueDate)
    const end = t.endDate ? parseDate(t.endDate) : start + duration * 24 * 60 * 60 * 1000
    const actualDuration = start && end ? (end - start) / (24 * 60 * 60 * 1000) : duration
    durationMap.set(t.id, Math.max(1, Math.ceil(actualDuration)))
  }
  const getDuration = (tid: string) => durationMap.get(tid) ?? 1
  const result: TaskWithSchedule[] = []

  const topologicalSort = (): Task[] => {
    const visited = new Set<string>()
    const order: Task[] = []
    const visit = (t: Task) => {
      if (visited.has(t.id)) return
      visited.add(t.id)
      for (const pid of t.predecessors || []) {
        const p = tasks.find((x) => x.id === pid)
        if (p) visit(p)
      }
      order.push(t)
    }
    for (const t of tasks) visit(t)
    return order
  }
  const sortedTasks = topologicalSort()

  for (const t of sortedTasks) {
    const preds = t.predecessors || []
    let es = 0
    for (const pid of preds) {
      const p = result.find((r) => r.id === pid)
      if (p) es = Math.max(es, p.earliestFinish)
    }
    const duration = getDuration(t.id)
    const ef = es + duration
    result.push({
      ...t,
      earliestStart: es,
      earliestFinish: ef,
      latestStart: 0,
      latestFinish: 0,
      slack: 0,
      isCritical: false,
    } as TaskWithSchedule)
  }

  const projectEnd = Math.max(...result.map((r) => r.earliestFinish), 0)
  const byIdResult = new Map(result.map((r) => [r.id, r]))

  const sortedByEf = [...result].sort((a, b) => b.earliestFinish - a.earliestFinish)
  for (const t of sortedByEf) {
    const successors = sortedTasks.filter((x) => x.predecessors?.includes(t.id))
    let lf = projectEnd
    if (successors.length > 0) {
      lf = Math.min(
        ...successors.map((s) => {
          const sr = byIdResult.get(s.id)
          return sr ? sr.latestStart : projectEnd
        })
      )
    }
    const duration = getDuration(t.id)
    const ls = lf - duration
    const slack = ls - t.earliestStart
    Object.assign(t, {
      latestStart: ls,
      latestFinish: lf,
      slack: Math.max(0, slack),
      isCritical: slack <= 0,
    })
  }

  return result
}

export function getCriticalPathIds(tasks: TaskWithSchedule[]): Set<string> {
  return new Set(tasks.filter((t) => t.isCritical).map((t) => t.id))
}
