import { Select, Avatar, Button, Space, Typography } from 'antd'
import { CalendarOutlined, DownOutlined, InboxOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import type { Task, TaskStatus } from '../../types'
import { isTaskArchived } from '../../utils/taskFilters'

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'not_started', title: 'Not Started' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'completed', title: 'Completed' },
]

const statusOptions = columns.map((c) => ({ value: c.status, label: c.title }))

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onArchiveChange: (taskId: string, archived: boolean) => void
  showArchivedColumn: boolean
  onToggleShowArchivedColumn: (show: boolean) => void
  archivedHiddenCount: number
  loading?: boolean
}

function TaskCard({
  task,
  onStatusChange,
  onArchiveChange,
  userMap,
}: {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onArchiveChange: (id: string, archived: boolean) => void
  userMap: Record<string, string>
}) {
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
      <div className="mt-2 pt-2 border-t border-[var(--border-muted)]">
        {isTaskArchived(task) ? (
          <Button type="link" size="small" className="px-0 h-auto text-xs" onClick={() => onArchiveChange(task.id, false)}>
            Restore from archive
          </Button>
        ) : (
          <Button type="link" size="small" className="px-0 h-auto text-xs" onClick={() => onArchiveChange(task.id, true)}>
            Archive
          </Button>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onArchiveChange,
  showArchivedColumn,
  onToggleShowArchivedColumn,
  archivedHiddenCount,
  loading,
}: KanbanBoardProps) {
  const { user } = useAuth()
  const companyId = user?.companyId
  const { data: users = [] } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => userService.getUsers(companyId),
    enabled: Boolean(companyId),
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  const workflowColumns = (
    <>
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => !isTaskArchived(t) && t.status === col.status)
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
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onArchiveChange={onArchiveChange} userMap={userMap} />
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
    </>
  )

  const archivedColumn = showArchivedColumn ? (
    <div className="flex-shrink-0 w-[280px] flex flex-col rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/30 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-[var(--border-muted)] flex items-center justify-between shrink-0">
        <span className="font-medium text-sm text-[var(--text-primary)] flex items-center gap-1.5">
          <InboxOutlined className="text-[var(--text-muted)]" />
          Archived
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
          {tasks.filter((t) => isTaskArchived(t)).length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-0">
        {tasks
          .filter((t) => isTaskArchived(t))
          .map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onArchiveChange={onArchiveChange} userMap={userMap} />
          ))}
        {tasks.filter((t) => isTaskArchived(t)).length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)] text-xs">
            <span>Nothing archived</span>
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Space size="small">
          <Typography.Text type="secondary" className="text-xs">
            Archived tasks stay out of the workflow columns until you open the archive column.
          </Typography.Text>
        </Space>
        {archivedHiddenCount > 0 && !showArchivedColumn ? (
          <Button type="link" size="small" className="px-0 text-xs h-auto" onClick={() => onToggleShowArchivedColumn(true)}>
            Show archive ({archivedHiddenCount})
          </Button>
        ) : null}
        {showArchivedColumn ? (
          <Button type="link" size="small" className="px-0 text-xs h-auto" onClick={() => onToggleShowArchivedColumn(false)}>
            Hide archive column
          </Button>
        ) : null}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 min-h-[400px]">
        {workflowColumns}
        {archivedColumn}
      </div>
    </div>
  )
}
