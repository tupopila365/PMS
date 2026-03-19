import { useMemo, useState } from 'react'
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react'
import { Segmented } from 'antd'
import 'gantt-task-react/dist/index.css'
import './GanttChart.css'
import { EmptyState } from '../ui/EmptyState'
import type { Task } from '../../types'

function toGanttTask(t: Task): GanttTask {
  const start = t.startDate ? new Date(t.startDate) : (t.dueDate ? new Date(t.dueDate) : new Date())
  let end = t.endDate ? new Date(t.endDate) : (t.duration ? new Date(start.getTime() + t.duration * 24 * 60 * 60 * 1000) : new Date(start.getTime() + 24 * 60 * 60 * 1000))
  if (end.getTime() < start.getTime()) end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const progress = t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0
  return {
    id: t.id,
    name: t.title,
    type: t.isMilestone ? 'milestone' : 'task',
    start,
    end,
    progress,
    dependencies: t.predecessors || [],
    styles: t.isMilestone
      ? { backgroundColor: '#f59e0b', backgroundSelectedColor: '#d97706', progressColor: '#fbbf24', progressSelectedColor: '#f59e0b' }
      : undefined,
  }
}

interface GanttChartProps {
  tasks: Task[]
  onDateChange?: (task: Task, start: Date, end: Date) => void
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: ViewMode.Day, label: 'Day' },
  { value: ViewMode.Week, label: 'Week' },
  { value: ViewMode.Month, label: 'Month' },
]

export function GanttChart({ tasks, onDateChange }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week)
  const ganttTasks = useMemo(() => tasks.map(toGanttTask), [tasks])

  const handleDateChange = (task: GanttTask, children: GanttTask[]) => {
    const t = tasks.find((x) => x.id === task.id)
    if (t && onDateChange) onDateChange(t, task.start, task.end)
  }

  if (ganttTasks.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm min-h-[280px] flex items-center justify-center">
        <EmptyState
          message="No tasks to display"
          description="Add tasks with start and end dates to see them on the Gantt chart."
        />
      </div>
    )
  }

  return (
    <div className="gantt-chart-wrapper">
      <div className="gantt-chart-toolbar">
        <Segmented
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          options={VIEW_MODES}
          size="middle"
        />
      </div>
      <div className="gantt-chart-inner">
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          viewDate={ganttTasks[0]?.start ? new Date(ganttTasks[0].start) : undefined}
          preStepsCount={1}
          listCellWidth="320"
          columnWidth={viewMode === ViewMode.Month ? 80 : viewMode === ViewMode.Week ? 64 : 48}
          barFill={70}
          barCornerRadius={8}
          barBackgroundColor="#3b82f6"
          barProgressColor="rgba(255,255,255,0.4)"
          barBackgroundSelectedColor="#60a5fa"
          rowHeight={56}
          headerHeight={60}
          fontFamily="'Inter', 'Plus Jakarta Sans', sans-serif"
          fontSize="13px"
          todayColor="rgba(59, 130, 246, 0.12)"
          arrowColor="#60a5fa"
          onDateChange={handleDateChange}
        />
      </div>
    </div>
  )
}
