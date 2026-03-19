import { Select, Avatar } from 'antd'
import { CalendarOutlined, DownOutlined } from '@ant-design/icons'
import { mockUsers } from '../../mocks/data'
import type { Task, TaskStatus } from '../../types'

const userMap = Object.fromEntries(mockUsers.map((u) => [u.id, u.name]))

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'not_started', title: 'Not Started' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'completed', title: 'Completed' },
]

const statusOptions = columns.map((c) => ({ value: c.status, label: c.title }))

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  loading?: boolean
}

function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: TaskStatus) => void }) {
  const assignees = task.assignedTo?.map((id) => userMap[id] || id) ?? []

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all group">
      <p className="font-medium text-[var(--text-primary)] text-sm m-0 mb-2 line-clamp-2 leading-snug">
        {task.title}
      </p>
      <div className="flex items-center gap-2 flex-wrap mb-2 min-h-[20px]">
        {assignees.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <Avatar.Group size={20} maxCount={2} className="[&_.ant-avatar]:text-[10px]">
              {task.assignedTo!.map((id) => (
                <Avatar key={id} size={20} className="bg-primary/20 text-[var(--color-primary)]">
                  {(userMap[id] || id).charAt(0)}
                </Avatar>
              ))}
            </Avatar.Group>
            <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[80px]">
              {assignees.join(', ')}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--text-muted)] italic">Unassigned</span>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] ml-auto">
            <CalendarOutlined className="text-[10px]" />
            {task.dueDate}
          </div>
        )}
      </div>
      <Select
        value={task.status}
        options={statusOptions}
        onChange={(v) => onStatusChange(task.id, v)}
        size="small"
        suffixIcon={<DownOutlined className="text-[10px]" />}
        className="w-full [&_.ant-select-selector]:text-xs"
      />
    </div>
  )
}

export function KanbanBoard({ tasks, onStatusChange, loading }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 min-h-[400px]">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status)
        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-[280px] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 overflow-hidden"
          >
            <div className="px-3 py-2.5 border-b border-[var(--border-muted)] flex items-center justify-between shrink-0">
              <span className="font-medium text-sm text-[var(--text-primary)]">{col.title}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-0">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
              ))}
              {columnTasks.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)] text-xs">
                  <div className="w-8 h-8 rounded-lg bg-[var(--border-muted)] mb-2 flex items-center justify-center">
                    <DownOutlined className="text-[var(--text-muted)] rotate-[-90deg]" />
                  </div>
                  <span>No tasks</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
