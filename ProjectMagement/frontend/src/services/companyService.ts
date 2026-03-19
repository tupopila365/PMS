import { api, USE_MOCK } from './api'
import { mockCompanies, mockSubscriptions } from '../mocks/data'
import type { Company, Subscription } from '../types'

export const companyService = {
  async getCompany(id: string): Promise<Company> {
    if (USE_MOCK) {
      const c = mockCompanies.find((x) => x.id === id)
      if (!c) throw new Error('Not found')
      return c
    }
    const { data } = await api.get<Company>(`/companies/${id}`)
    return data
  },

  async getSubscription(companyId: string): Promise<Subscription | null> {
    if (USE_MOCK) {
      return mockSubscriptions.find((s) => s.companyId === companyId) || null
    }
    const { data } = await api.get<Subscription | null>(`/companies/${companyId}/subscription`)
    return data
  },
}
