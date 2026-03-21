import { api } from './api'
import type { Task } from '../types'

export const taskService = {
  async getTasks(projectId?: string): Promise<Task[]> {
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<Task[]>('/tasks', { params })
    return data
  },

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const { data } = await api.post<Task>('/tasks', task)
    return data
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data } = await api.put<Task>(`/tasks/${id}`, updates)
    return data
  },
}
