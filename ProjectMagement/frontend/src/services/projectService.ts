import { api, USE_MOCK } from './api'
import { mockProjects } from '../mocks/data'
import { auditService } from './auditService'
import type { Project } from '../types'

export const projectService = {
  async getProjects(): Promise<Project[]> {
    if (USE_MOCK) return mockProjects
    const { data } = await api.get<Project[]>('/projects')
    return data
  },

  async getProject(id: string): Promise<Project> {
    if (USE_MOCK) {
      const p = mockProjects.find((x) => x.id === id)
      if (!p) throw new Error('Not found')
      return p
    }
    const { data } = await api.get<Project>(`/projects/${id}`)
    return data
  },

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    if (USE_MOCK) {
      const newProject: Project = { ...project, id: 'new-' + Date.now() }
      mockProjects.push(newProject)
      auditService.log('workflow_changed', 'project', newProject.id, newProject.name, newProject.id)
      return newProject
    }
    const { data } = await api.post<Project>('/projects', project)
    return data
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    if (USE_MOCK) {
      const p = mockProjects.find((x) => x.id === id)
      if (!p) throw new Error('Not found')
      Object.assign(p, project)
      if (project.budget != null) auditService.log('budget_updated', 'project', id, p.name, id)
      return p
    }
    const { data } = await api.put<Project>(`/projects/${id}`, project)
    return data
  },
}
