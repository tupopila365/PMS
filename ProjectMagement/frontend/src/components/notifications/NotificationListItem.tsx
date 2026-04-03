import { useNavigate } from 'react-router-dom'
import type { Notification } from '../../types'
import { useProjectContext } from '../../context/ProjectContext'

function formatShortDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Older assignment notifications used `message` = "Task title — Project name". */
function legacyTaskProjectFromMessage(message: string | undefined): { task?: string; project?: string } {
  if (!message) return {}
  const m = message.trim()
  const sep = ' — '
  const idx = m.lastIndexOf(sep)
  if (idx <= 0) return {}
  const task = m.slice(0, idx).trim()
  const project = m.slice(idx + sep.length).trim()
  if (!task && !project) return {}
  return { task: task || undefined, project: project || undefined }
}

interface Props {
  n: Notification
  onMarkRead: (id: string) => void
}

export function NotificationListItem({ n, onMarkRead }: Props) {
  const navigate = useNavigate()
  const { setSelectedProjectId } = useProjectContext()

  const handleClick = () => {
    onMarkRead(n.id)
    if (n.type === 'assignment' && n.projectId) {
      setSelectedProjectId(n.projectId)
      navigate('/tasks')
    }
  }

  if (n.type === 'assignment') {
    const legacy = legacyTaskProjectFromMessage(n.message)
    const taskLabel =
      n.taskTitle ||
      legacy.task ||
      (n.title.startsWith('Assigned: ') ? n.title.slice('Assigned: '.length).trim() : null) ||
      (n.title.toLowerCase() === 'task assigned to you' ? null : n.title) ||
      'Task'
    const projectLabel = n.projectName || legacy.project || '—'
    const by = n.assignedByName
    const due = n.dueDate ? formatShortDate(n.dueDate) : null

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left p-3 border-b border-[var(--border-muted)] cursor-pointer transition-colors hover:bg-[var(--surface-muted)] ${
          !n.read ? 'bg-primary/5' : ''
        }`}
      >
        <div className={`text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1`}>
          Task assignment
        </div>
        <div className={`${n.read ? 'font-medium' : 'font-semibold'} text-[var(--text-primary)] text-sm leading-snug`}>
          {taskLabel}
        </div>
        <dl className="mt-2 space-y-1 text-xs text-[var(--text-secondary)] m-0">
          <div className="flex gap-1.5">
            <dt className="text-[var(--text-muted)] shrink-0">Project</dt>
            <dd className="m-0 min-w-0 font-medium text-[var(--text-primary)]">{projectLabel}</dd>
          </div>
          {by ? (
            <div className="flex gap-1.5">
              <dt className="text-[var(--text-muted)] shrink-0">Assigned by</dt>
              <dd className="m-0 min-w-0">{by}</dd>
            </div>
          ) : null}
          <div className="flex gap-1.5">
            <dt className="text-[var(--text-muted)] shrink-0">Due</dt>
            <dd className="m-0 min-w-0">{due ?? 'Not set'}</dd>
          </div>
        </dl>
        {n.projectId ? (
          <div className="text-[11px] text-[var(--color-primary)] mt-2 font-medium">Open task list →</div>
        ) : null}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onMarkRead(n.id)}
      className={`w-full text-left p-3 border-b border-[var(--border-muted)] cursor-pointer transition-colors hover:bg-[var(--surface-muted)] ${
        !n.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className={`${n.read ? 'font-normal' : 'font-semibold'} text-[var(--text-primary)]`}>{n.title}</div>
      <div className="text-sm text-[var(--text-secondary)] mt-0.5 whitespace-pre-wrap break-words">{n.message}</div>
      {n.createdAt ? (
        <div className="text-[11px] text-[var(--text-muted)] mt-1.5">{formatShortDate(n.createdAt)}</div>
      ) : null}
    </button>
  )
}
