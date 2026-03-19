import { api, USE_MOCK } from './api'
import { mockTasks, mockProjects } from '../mocks/data'
import { auditService } from './auditService'
import type { Task } from '../types'

export const taskService = {
  async getTasks(projectId?: string): Promise<Task[]> {
    if (USE_MOCK) return projectId ? mockTasks.filter((t) => t.projectId === projectId) : mockTasks
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<Task[]>('/tasks', { params })
    return data
  },

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    if (USE_MOCK) {
      const newTask: Task = { ...task, id: 'task-' + Date.now() }
      mockTasks.push(newTask)
      const project = mockProjects.find((p) => p.id === task.projectId)
      auditService.log('task_created', 'task', task.projectId, project?.name || 'Unknown', newTask.id)
      return newTask
    }
    const { data } = await api.post<Task>('/tasks', task)
    return data
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (USE_MOCK) {
      const t = mockTasks.find((x) => x.id === id)
      if (!t) throw new Error('Not found')
      Object.assign(t, updates)
      const project = mockProjects.find((p) => p.id === t.projectId)
      auditService.log('task_updated', 'task', t.projectId, project?.name || 'Unknown', id)
      return t
    }
    const { data } = await api.put<Task>(`/tasks/${id}`, updates)
    return data
  },
}
