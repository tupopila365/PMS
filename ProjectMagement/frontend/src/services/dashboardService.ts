import { api, USE_MOCK } from './api'
import { mockProjects, mockTasks, mockInvoices, mockPayments, mockCostCategories } from '../mocks/data'
import { getProjectRiskLevelFromRisks } from '../utils/projectRisk'
import type { DashboardKPIs } from '../types'

function getProjectActualCost(projectId: string): number {
  const cbsTotal = mockCostCategories
    .filter((c) => c.projectId === projectId)
    .reduce((s, c) => s + c.actualCost, 0)
  if (cbsTotal > 0) return cbsTotal
  const projectInvoices = mockInvoices.filter((i) => i.projectId === projectId)
  const paidAmount = mockPayments
    .filter((p) => projectInvoices.some((i) => i.id === p.invoiceId))
    .reduce((s, p) => s + p.amountPaid, 0)
  if (paidAmount > 0) return paidAmount
  const proj = mockProjects.find((p) => p.id === projectId)
  return proj?.actualCost || 0
}

export const dashboardService = {
  async getKPIs(): Promise<DashboardKPIs> {
    if (USE_MOCK) {
      const totalProjects = mockProjects.length
      const activeProjects = mockProjects.filter((p) => p.status === 'active').length
      const onTrackCount = mockProjects.filter((p) => getProjectRiskLevelFromRisks(p.id, p.riskLevel) === 'low').length
      const atRiskCount = mockProjects.filter((p) => {
        const level = getProjectRiskLevelFromRisks(p.id, p.riskLevel)
        return level === 'medium' || level === 'high'
      }).length
      const completedTasks = mockTasks.filter((t) => t.status === 'completed').length
      const completionRate = mockTasks.length > 0 ? Math.round((completedTasks / mockTasks.length) * 100) : 0
      const totalBudget = mockProjects.reduce((sum, p) => sum + (p.budget || 0), 0) || mockInvoices.reduce((sum, i) => sum + i.amount, 0)
      const totalPaid = mockPayments.reduce((sum, p) => sum + p.amountPaid, 0)
      const totalActualCost = mockProjects.reduce((sum, p) => sum + getProjectActualCost(p.id), 0)
      const outstandingBalance = totalBudget - totalPaid
      const aggregateVariance = totalBudget - totalActualCost
      return {
        totalProjects,
        activeProjects,
        onTrackCount,
        atRiskCount,
        completionRate,
        totalBudget,
        totalPaid,
        outstandingBalance,
        aggregateVariance,
      }
    }
    const { data } = await api.get<DashboardKPIs>('/dashboard/kpis')
    return data
  },
}
