import { api } from './api'
import type { Company, Subscription } from '../types'

export const companyService = {
  async getCompany(id: string): Promise<Company> {
    const { data } = await api.get<Company>(`/companies/${id}`)
    return data
  },

  async getSubscription(companyId: string): Promise<Subscription | null> {
    const { data } = await api.get<Subscription | null>(`/companies/${companyId}/subscription`)
    return data
  },

  async updateCompany(id: string, body: Partial<Pick<Company, 'name'>>): Promise<Company> {
    const { data } = await api.put<Company>(`/companies/${id}`, body)
    return data
  },
}
