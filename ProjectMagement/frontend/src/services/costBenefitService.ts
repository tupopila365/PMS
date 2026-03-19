import { api, USE_MOCK } from './api'
import { mockCostBenefitAnalyses } from '../mocks/data'
import type { CostBenefitAnalysis } from '../types'

export const costBenefitService = {
  async getAnalysis(projectId: string): Promise<CostBenefitAnalysis | null> {
    if (USE_MOCK) return mockCostBenefitAnalyses.find((c) => c.projectId === projectId) || null
    const { data } = await api.get<CostBenefitAnalysis | null>(`/projects/${projectId}/cost-benefit`)
    return data
  },

  async saveAnalysis(analysis: CostBenefitAnalysis): Promise<CostBenefitAnalysis> {
    if (USE_MOCK) {
      const i = mockCostBenefitAnalyses.findIndex((c) => c.projectId === analysis.projectId)
      if (i >= 0) mockCostBenefitAnalyses[i] = analysis
      else mockCostBenefitAnalyses.push(analysis)
      return analysis
    }
    const { data } = await api.put<CostBenefitAnalysis>(`/projects/${analysis.projectId}/cost-benefit`, analysis)
    return data
  },
}
