import { useMemo, useState, useRef, useLayoutEffect, useCallback, useEffect, type CSSProperties } from 'react'
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react'
import { Segmented, Button, Space } from 'antd'
import { CalendarOutlined, CompressOutlined } from '@ant-design/icons'
import 'gantt-task-react/dist/index.css'
import './GanttChart.css'
import { EmptyState } from '../ui/EmptyState'
import { GanttTaskListHeader, GanttTaskListTable } from './GanttTaskList'
import type { Task } from '../../types'
import {
  type GanttDesignId,
  GANTT_DESIGN_OPTIONS,
  GANTT_DESIGN_STORAGE_KEY,
  ganttChromeForDesign,
  readStoredGanttDesign,
  taskToGanttTask,
} from './ganttDesign'

const GANTT_HEADER_PX = 56
const BOTTOM_SCROLL_RESERVE = 28
const ROW_HEIGHT_PX = 72

interface GanttChartProps {
  tasks: Task[]
  onDateChange?: (task: Task, start: Date, end: Date) => void
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: ViewMode.Day, label: 'Days' },
  { value: ViewMode.Week, label: 'Weeks' },
  { value: ViewMode.Month, label: 'Months' },
  { value: ViewMode.Year, label: 'Years' },
]

function spanDays(tasks: Task[]): number {
  const dates: number[] = []
  for (const t of tasks) {
    const s = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : null
    const e = t.endDate ? new Date(t.endDate) : t.dueDate ? new Date(t.dueDate) : s
    if (s) dates.push(s.getTime())
    if (e) dates.push(e.getTime())
  }
  if (dates.length < 2) return 30
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  return Math.max(1, Math.ceil((max - min) / (24 * 60 * 60 * 1000)))
}

export function GanttChart({ tasks, onDateChange }: GanttChartProps) {
  const [design, setDesign] = useState<GanttDesignId>(readStoredGanttDesign)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week)
  const [viewDate, setViewDate] = useState<Date | undefined>(undefined)
  const mountRef = useRef<HTMLDivElement>(null)
  const [ganttHeight, setGanttHeight] = useState(720)

  useEffect(() => {
    try {
      localStorage.setItem(GANTT_DESIGN_STORAGE_KEY, design)
    } catch {
      /* ignore */
    }
  }, [design])

  const ganttTasks = useMemo(() => tasks.map((t, i) => taskToGanttTask(t, i, design)), [tasks, design])

  const chrome = useMemo(() => ganttChromeForDesign(design), [design])

  const measure = useCallback(() => {
    const el = mountRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h < 40) return
    const rows = Math.floor(h - BOTTOM_SCROLL_RESERVE - GANTT_HEADER_PX)
    setGanttHeight(Math.max(360, rows))
  }, [])

  useLayoutEffect(() => {
    measure()
    const el = mountRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      measure()
      requestAnimationFrame(measure)
    })
    ro.observe(el)
    window.addEventListener('resize', measure)
    const t0 = window.setTimeout(measure, 0)
    const t1 = window.setTimeout(measure, 100)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [measure])

  const handleDateChange = (task: GanttTask, _children: GanttTask[]) => {
    const t = tasks.find((x) => x.id === task.id)
    if (t && onDateChange) onDateChange(t, task.start, task.end)
  }

  const scrollToToday = () => setViewDate(new Date())

  const fitTimeline = () => {
    const days = spanDays(tasks)
    if (days > 365) setViewMode(ViewMode.Year)
    else if (days > 120) setViewMode(ViewMode.Month)
    else if (days > 45) setViewMode(ViewMode.Week)
    else setViewMode(ViewMode.Day)
    setViewDate(new Date())
  }

  const columnWidth =
    viewMode === ViewMode.Year ? 52 : viewMode === ViewMode.Month ? 80 : viewMode === ViewMode.Week ? 64 : 72

  const shellStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    height: '100%',
  }

  const designToolbar = (
    <div className="gantt-chart-toolbar__design">
      <span className="gantt-chart-toolbar__design-label">Look</span>
      <Segmented
        size="small"
        value={design}
        onChange={(v) => setDesign(v as GanttDesignId)}
        options={GANTT_DESIGN_OPTIONS}
      />
    </div>
  )

  if (ganttTasks.length === 0) {
    return (
      <div className="gantt-design-root" style={shellStyle} data-gantt-design={design}>
        <div className="gantt-chart-toolbar gantt-chart-toolbar--design-only border-b border-[var(--border-muted)]">
          <div />
          {designToolbar}
        </div>
        <div className="gantt-chart-empty flex-1 min-h-0 flex items-center justify-center bg-[var(--surface)] overflow-hidden">
          <EmptyState
            message="No tasks to display"
            description="Add tasks with start and end dates to see them on the Gantt chart."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="gantt-design-root" style={shellStyle} data-gantt-design={design}>
      <div className="gantt-chart-wrapper">
        <div className="gantt-chart-toolbar">
          <Space wrap className="gantt-chart-toolbar__left">
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              options={VIEW_MODES}
              size="middle"
            />
            {designToolbar}
          </Space>
          <Space wrap className="gantt-chart-toolbar__right">
            <Button icon={<CalendarOutlined />} onClick={scrollToToday}>
              Today
            </Button>
            <Button icon={<CompressOutlined />} onClick={fitTimeline}>
              Fit
            </Button>
          </Space>
        </div>
        <div className="gantt-chart-body">
          <div ref={mountRef} className="gantt-chart-react-mount">
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              viewDate={viewDate}
              preStepsCount={3}
              listCellWidth="500px"
              columnWidth={columnWidth}
              barFill={chrome.barFill}
              barCornerRadius={chrome.barCornerRadius}
              barBackgroundColor={chrome.barBackgroundColor}
              barProgressColor={chrome.barProgressColor}
              barBackgroundSelectedColor={chrome.barBackgroundSelectedColor}
              barProgressSelectedColor={chrome.barProgressSelectedColor}
              arrowColor={chrome.arrowColor}
              arrowIndent={24}
              rowHeight={ROW_HEIGHT_PX}
              headerHeight={GANTT_HEADER_PX}
              ganttHeight={ganttHeight}
              fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
              fontSize="14px"
              todayColor={chrome.todayColor}
              TaskListHeader={GanttTaskListHeader}
              TaskListTable={GanttTaskListTable}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
