import React from 'react'
import type { Task } from 'gantt-task-react'

const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const GanttTaskListHeader: React.FC<{
  headerHeight: number
  rowWidth: string
  fontFamily: string
  fontSize: string
}> = ({ headerHeight, fontFamily, fontSize }) => (
  <div
    className="gantt-task-list-header"
    style={{ fontFamily, fontSize, height: headerHeight - 2 }}
  >
    <div className="gantt-task-list-header__name">Name</div>
    <div className="gantt-task-list-header__from">From</div>
    <div className="gantt-task-list-header__to">To</div>
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
}> = ({ rowHeight, tasks, fontFamily, fontSize, setSelectedTask, onExpanderClick }) => (
  <div className="gantt-task-list-table" style={{ fontFamily, fontSize }}>
    {tasks.map((t) => (
      <div
        key={t.id + 'row'}
        className={`gantt-task-list-row ${selectedTaskId === t.id ? 'selected' : ''}`}
        style={{ height: rowHeight }}
        onClick={() => setSelectedTask(t.id)}
      >
        <div className="gantt-task-list-cell gantt-task-list-cell--name" title={t.name}>
          <div className="gantt-task-list-cell__content">
            <span className="gantt-task-list-expander" onClick={(e) => { e.stopPropagation(); onExpanderClick(t) }}>
              {t.hideChildren === false ? '▼' : t.hideChildren === true ? '▶' : ''}
            </span>
            <span>{t.name}</span>
          </div>
        </div>
        <div className="gantt-task-list-cell gantt-task-list-cell--date">{shortDate(t.start)}</div>
        <div className="gantt-task-list-cell gantt-task-list-cell--date">{shortDate(t.end)}</div>
      </div>
    ))}
  </div>
)
