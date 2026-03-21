import { api } from './api'
import type { ProjectBaseline } from '../types'

export const baselineService = {
  async getBaselines(projectId?: string): Promise<ProjectBaseline[]> {
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<ProjectBaseline[]>('/baselines', { params })
    return data
  },

  async createBaseline(
    projectId: string,
    scheduleSnapshot?: { taskId: string; startDate: string; endDate: string }[]
  ): Promise<ProjectBaseline> {
    const { data } = await api.post<ProjectBaseline>('/baselines', { projectId, scheduleSnapshot })
    return data
  },
}
