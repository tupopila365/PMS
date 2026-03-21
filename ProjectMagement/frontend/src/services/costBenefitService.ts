import { api } from './api'
import type { CostBenefitAnalysis } from '../types'

export const costBenefitService = {
  async getAnalysis(projectId: string): Promise<CostBenefitAnalysis | null> {
    const { data } = await api.get<CostBenefitAnalysis | null>(`/projects/${projectId}/cost-benefit`)
    return data
  },

  async saveAnalysis(analysis: CostBenefitAnalysis): Promise<CostBenefitAnalysis> {
    const { data } = await api.put<CostBenefitAnalysis>(`/projects/${analysis.projectId}/cost-benefit`, analysis)
    return data
  },
}
