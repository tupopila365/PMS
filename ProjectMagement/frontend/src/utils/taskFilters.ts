import type { Task } from '../types'

export function isTaskArchived(task: Task): boolean {
  return Boolean(task.archived)
}

/** Active workflow tasks only (excludes archived bucket). */
export function isTaskNonArchived(task: Task): boolean {
  return !isTaskArchived(task)
}

/**
 * List / timeline default: hide completed and archived unless toggles allow them.
 */
export function filterTasksForDefaultViews(
  tasks: Task[],
  opts: { showCompleted: boolean; showArchived: boolean }
): Task[] {
  return tasks.filter((t) => {
    if (isTaskArchived(t) && !opts.showArchived) return false
    if (!isTaskArchived(t) && t.status === 'completed' && !opts.showCompleted) return false
    return true
  })
}

export function countHiddenByDefault(tasks: Task[]): { completed: number; archived: number } {
  let completed = 0
  let archived = 0
  for (const t of tasks) {
    if (isTaskArchived(t)) archived++
    else if (t.status === 'completed') completed++
  }
  return { completed, archived }
}
