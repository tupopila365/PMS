import { api } from './api'
import type { CostCategory } from '../types'

export const costService = {
  async getCategories(projectId: string): Promise<CostCategory[]> {
    const { data } = await api.get<CostCategory[]>(`/projects/${projectId}/cost-categories`)
    return data
  },

  async createCategory(category: Omit<CostCategory, 'id'>): Promise<CostCategory> {
    const { data } = await api.post<CostCategory>(`/projects/${category.projectId}/cost-categories`, category)
    return data
  },

  async updateCategory(id: string, projectId: string, updates: Partial<CostCategory>): Promise<CostCategory> {
    const { data } = await api.put<CostCategory>(`/projects/${projectId}/cost-categories/${id}`, updates)
    return data
  },
}
