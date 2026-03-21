import { api } from './api'
import type { RiskAlert } from '../types'

export const alertService = {
  async getRiskAlerts(): Promise<RiskAlert[]> {
    const { data } = await api.get<RiskAlert[]>('/alerts/risk')
    return data
  },
}
