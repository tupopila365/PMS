import type { Task as GanttTask } from 'gantt-task-react'
import type { Task } from '../../types'

export type GanttDesignId = 'control-room' | 'soft' | 'editorial'

export const GANTT_DESIGN_STORAGE_KEY = 'cbmp-gantt-design'

export const GANTT_DESIGN_OPTIONS: { value: GanttDesignId; label: string }[] = [
  { value: 'control-room', label: 'Control' },
  { value: 'soft', label: 'Soft' },
  { value: 'editorial', label: 'Editorial' },
]

type BarStyle = {
  backgroundColor: string
  backgroundSelectedColor: string
  progressColor: string
  progressSelectedColor: string
}

const BARS_CONTROL: BarStyle[] = [
  { backgroundColor: '#0e7490', backgroundSelectedColor: '#155e75', progressColor: 'rgba(255,255,255,0.35)', progressSelectedColor: 'rgba(255,255,255,0.48)' },
  { backgroundColor: '#0369a1', backgroundSelectedColor: '#075985', progressColor: 'rgba(255,255,255,0.32)', progressSelectedColor: 'rgba(255,255,255,0.45)' },
  { backgroundColor: '#4c1d95', backgroundSelectedColor: '#5b21b6', progressColor: 'rgba(255,255,255,0.3)', progressSelectedColor: 'rgba(255,255,255,0.42)' },
  { backgroundColor: '#0f766e', backgroundSelectedColor: '#115e59', progressColor: 'rgba(255,255,255,0.34)', progressSelectedColor: 'rgba(255,255,255,0.46)' },
]

const BARS_SOFT: BarStyle[] = [
  { backgroundColor: '#86efac', backgroundSelectedColor: '#4ade80', progressColor: 'rgba(22,101,52,0.35)', progressSelectedColor: 'rgba(22,101,52,0.5)' },
  { backgroundColor: '#93c5fd', backgroundSelectedColor: '#60a5fa', progressColor: 'rgba(30,58,138,0.3)', progressSelectedColor: 'rgba(30,58,138,0.45)' },
  { backgroundColor: '#fcd34d', backgroundSelectedColor: '#fbbf24', progressColor: 'rgba(120,53,15,0.28)', progressSelectedColor: 'rgba(120,53,15,0.42)' },
  { backgroundColor: '#d8b4fe', backgroundSelectedColor: '#c084fc', progressColor: 'rgba(88,28,135,0.28)', progressSelectedColor: 'rgba(88,28,135,0.42)' },
]

const BARS_EDITORIAL: BarStyle[] = [
  { backgroundColor: '#1e293b', backgroundSelectedColor: '#0f172a', progressColor: 'rgba(255,255,255,0.22)', progressSelectedColor: 'rgba(255,255,255,0.35)' },
  { backgroundColor: '#334155', backgroundSelectedColor: '#1e293b', progressColor: 'rgba(255,255,255,0.2)', progressSelectedColor: 'rgba(255,255,255,0.32)' },
  { backgroundColor: '#475569', backgroundSelectedColor: '#334155', progressColor: 'rgba(255,255,255,0.18)', progressSelectedColor: 'rgba(255,255,255,0.3)' },
  { backgroundColor: '#64748b', backgroundSelectedColor: '#475569', progressColor: 'rgba(255,255,255,0.2)', progressSelectedColor: 'rgba(255,255,255,0.32)' },
]

const MILESTONE: Record<GanttDesignId, BarStyle> = {
  'control-room': {
    backgroundColor: '#22d3ee',
    backgroundSelectedColor: '#06b6d4',
    progressColor: 'rgba(255,255,255,0.5)',
    progressSelectedColor: 'rgba(255,255,255,0.65)',
  },
  soft: {
    backgroundColor: '#fbbf24',
    backgroundSelectedColor: '#f59e0b',
    progressColor: 'rgba(120,53,15,0.35)',
    progressSelectedColor: 'rgba(120,53,15,0.5)',
  },
  editorial: {
    backgroundColor: '#0f172a',
    backgroundSelectedColor: '#020617',
    progressColor: '#e2e8f0',
    progressSelectedColor: '#f8fafc',
  },
}

export function ganttChromeForDesign(design: GanttDesignId) {
  switch (design) {
    case 'control-room':
      return {
        arrowColor: '#22d3ee',
        todayColor: 'rgba(34, 211, 238, 0.22)',
        barCornerRadius: 4,
        barFill: 82,
        barBackgroundColor: '#164e63',
        barProgressColor: 'rgba(255,255,255,0.32)',
        barBackgroundSelectedColor: '#155e75',
        barProgressSelectedColor: 'rgba(255,255,255,0.45)',
      }
    case 'soft':
      return {
        arrowColor: '#b45309',
        todayColor: 'rgba(161, 98, 7, 0.12)',
        barCornerRadius: 14,
        barFill: 76,
        barBackgroundColor: '#a8a29e',
        barProgressColor: 'rgba(255,255,255,0.38)',
        barBackgroundSelectedColor: '#78716c',
        barProgressSelectedColor: 'rgba(255,255,255,0.5)',
      }
    case 'editorial':
      return {
        arrowColor: '#64748b',
        todayColor: 'rgba(15, 23, 42, 0.08)',
        barCornerRadius: 2,
        barFill: 88,
        barBackgroundColor: '#475569',
        barProgressColor: 'rgba(255,255,255,0.22)',
        barBackgroundSelectedColor: '#334155',
        barProgressSelectedColor: 'rgba(255,255,255,0.34)',
      }
  }
}

function barsForDesign(design: GanttDesignId): BarStyle[] {
  switch (design) {
    case 'control-room':
      return BARS_CONTROL
    case 'soft':
      return BARS_SOFT
    case 'editorial':
      return BARS_EDITORIAL
  }
}

export function taskToGanttTask(t: Task, index: number, design: GanttDesignId): GanttTask {
  const start = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : new Date()
  let end = t.endDate
    ? new Date(t.endDate)
    : t.duration
      ? new Date(start.getTime() + t.duration * 24 * 60 * 60 * 1000)
      : new Date(start.getTime() + 24 * 60 * 60 * 1000)
  if (end.getTime() < start.getTime()) end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const progress = t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0
  const palette = barsForDesign(design)[index % 4]
  return {
    id: t.id,
    name: t.title,
    type: t.isMilestone ? 'milestone' : 'task',
    start,
    end,
    progress,
    dependencies: t.predecessors || [],
    styles: t.isMilestone ? MILESTONE[design] : palette,
  }
}

export function readStoredGanttDesign(): GanttDesignId {
  try {
    const v = localStorage.getItem(GANTT_DESIGN_STORAGE_KEY)
    if (v === 'control-room' || v === 'soft' || v === 'editorial') return v
  } catch {
    /* ignore */
  }
  return 'soft'
}
