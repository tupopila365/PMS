import { api, USE_MOCK } from './api'
import { mockCostCategories } from '../mocks/data'
import type { CostCategory } from '../types'

export const costService = {
  async getCategories(projectId: string): Promise<CostCategory[]> {
    if (USE_MOCK) return mockCostCategories.filter((c) => c.projectId === projectId)
    const { data } = await api.get<CostCategory[]>(`/projects/${projectId}/cost-categories`)
    return data
  },

  async createCategory(category: Omit<CostCategory, 'id'>): Promise<CostCategory> {
    if (USE_MOCK) {
      const newCat: CostCategory = { ...category, id: 'cost-' + Date.now() }
      mockCostCategories.push(newCat)
      return newCat
    }
    const { data } = await api.post<CostCategory>(`/projects/${category.projectId}/cost-categories`, category)
    return data
  },

  async updateCategory(id: string, projectId: string, updates: Partial<CostCategory>): Promise<CostCategory> {
    if (USE_MOCK) {
      const c = mockCostCategories.find((x) => x.id === id)
      if (!c) throw new Error('Not found')
      Object.assign(c, updates)
      return c
    }
    const { data } = await api.put<CostCategory>(`/projects/${projectId}/cost-categories/${id}`, updates)
    return data
  },
}
