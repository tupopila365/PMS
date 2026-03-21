import { api } from './api'
import type { Project } from '../types'

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data } = await api.get<Project[]>('/projects')
    return data
  },

  async getProject(id: string): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`)
    return data
  },

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    const { data } = await api.post<Project>('/projects', project)
    return data
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const { data } = await api.put<Project>(`/projects/${id}`, project)
    return data
  },
}
