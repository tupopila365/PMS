import { api } from './api'
import type { DashboardKPIs } from '../types'

export const dashboardService = {
  async getKPIs(): Promise<DashboardKPIs> {
    const { data } = await api.get<DashboardKPIs>('/dashboard/kpis')
    return data
  },
}
