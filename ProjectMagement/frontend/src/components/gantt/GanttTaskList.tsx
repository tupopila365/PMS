import React from 'react'
import type { Task } from 'gantt-task-react'

const shortDate = (d: Date, locale: string) =>
  d.toLocaleDateString(locale || 'en-GB', { day: 'numeric', month: 'short' })

export const GanttTaskListHeader: React.FC<{
  headerHeight: number
  rowWidth: string
  fontFamily: string
  fontSize: string
}> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => (
  <div
    className="gantt-task-list-header"
    style={{
      fontFamily,
      fontSize,
      height: headerHeight,
      boxSizing: 'border-box',
      width: rowWidth,
      minWidth: rowWidth,
    }}
  >
    <div className="gantt-task-list-header__name">Task name</div>
    <div className="gantt-task-list-header__from">Start</div>
    <div className="gantt-task-list-header__to">End</div>
  </div>
)

export const GanttTaskListTable: React.FC<{
  rowHeight: number
  rowWidth: string
  fontFamily: string
  fontSize: string
  locale: string
  tasks: Task[]
  selectedTaskId: string
  setSelectedTask: (taskId: string) => void
  onExpanderClick: (task: Task) => void
}> = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize, locale, selectedTaskId, setSelectedTask, onExpanderClick }) => (
  <div className="gantt-task-list-table" style={{ fontFamily, fontSize, width: rowWidth, minWidth: rowWidth }}>
    {tasks.map((t) => (
      <div
        key={t.id + 'row'}
        className={`gantt-task-list-row ${selectedTaskId === t.id ? 'selected' : ''}`}
        style={{ height: rowHeight, boxSizing: 'border-box' }}
        onClick={() => setSelectedTask(t.id)}
      >
        <div className="gantt-task-list-cell gantt-task-list-cell--name" title={t.name}>
          <div className="gantt-task-list-cell__content">
            <span
              className="gantt-task-list-expander"
              onClick={(e) => {
                e.stopPropagation()
                onExpanderClick(t)
              }}
            >
              {t.hideChildren === false ? '▼' : t.hideChildren === true ? '▶' : ''}
            </span>
            <span>{t.name}</span>
          </div>
        </div>
        <div className="gantt-task-list-cell gantt-task-list-cell--date">{shortDate(t.start, locale)}</div>
        <div className="gantt-task-list-cell gantt-task-list-cell--date">{shortDate(t.end, locale)}</div>
      </div>
    ))}
  </div>
)
