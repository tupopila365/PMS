import { api, USE_MOCK } from './api'
import { mockBaselines, mockProjects } from '../mocks/data'
import type { ProjectBaseline } from '../types'

export const baselineService = {
  async getBaselines(projectId?: string): Promise<ProjectBaseline[]> {
    if (USE_MOCK) {
      let list = [...mockBaselines]
      if (projectId) list = list.filter((b) => b.projectId === projectId)
      return list
    }
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<ProjectBaseline[]>('/baselines', { params })
    return data
  },

  async createBaseline(projectId: string, scheduleSnapshot?: { taskId: string; startDate: string; endDate: string }[]): Promise<ProjectBaseline> {
    if (USE_MOCK) {
      const project = mockProjects.find((p) => p.id === projectId)
      const newBaseline: ProjectBaseline = {
        id: 'bl-' + Date.now(),
        projectId,
        baselineDate: new Date().toISOString().slice(0, 10),
        budget: project?.budget || 0,
        plannedEndDate: project?.plannedEndDate || '',
        scheduleSnapshot,
      }
      mockBaselines.push(newBaseline)
      return newBaseline
    }
    const { data } = await api.post<ProjectBaseline>('/baselines', { projectId, scheduleSnapshot })
    return data
  },
}
