import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Progress } from 'antd'
import { projectService } from '../../services/projectService'
import { riskService } from '../../services/riskService'
import { useProjectContext } from '../../context/ProjectContext'
import { getProjectRiskLevelFromRisks } from '../../utils/projectRisk'
import type { RiskLevel } from '../../types'
import { chartColorForProjectType, formatProjectTypeLabel } from '../../utils/projectType'

const riskColors: Record<RiskLevel, string> = {
  low: '#52c41a',
  medium: '#fa8c16',
  high: '#f5222d',
}

export function PortfolioAnalytics() {
  const { selectedProjectId } = useProjectContext()
  const { data: projectsAll } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', selectedProjectId],
    queryFn: () => riskService.getRisks(selectedProjectId),
  })

  const projects = useMemo(() => {
    if (!selectedProjectId) return projectsAll || []
    return (projectsAll || []).filter((p) => p.id === selectedProjectId)
  }, [projectsAll, selectedProjectId])

  const byType = projects.reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1
      return acc
    },
    {}
  )

  const byRisk = projects.reduce<Record<RiskLevel, number>>(
    (acc, p) => {
      const level = getProjectRiskLevelFromRisks(risks, p.id, p.riskLevel) || 'low'
      acc[level] = (acc[level] || 0) + 1
      return acc
    },
    { low: 0, medium: 0, high: 0 }
  )

  const total = projects?.length || 1

  const typeData = Object.entries(byType).map(([type, count]) => ({
    type,
    count,
    percent: Math.round((count / total) * 100),
  }))

  const riskData = [
    { level: 'low' as RiskLevel, count: byRisk.low, percent: Math.round((byRisk.low / total) * 100) },
    { level: 'medium' as RiskLevel, count: byRisk.medium, percent: Math.round((byRisk.medium / total) * 100) },
    { level: 'high' as RiskLevel, count: byRisk.high, percent: Math.round((byRisk.high / total) * 100) },
  ]

  return (
    <Card
      title="Portfolio Analytics"
      className="rounded-md border border-[var(--border)] shadow-none"
      styles={{
        header: {
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          fontWeight: 600,
          fontSize: 14,
        },
        body: { padding: '20px 24px' },
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] m-0 mb-3">Projects by Type</h4>
        {typeData.map(({ type, count, percent }) => (
          <div key={type} style={{ marginBottom: 8 }}>
            <div className="flex justify-between mb-1 text-sm text-[var(--text-primary)]">
              <span>{formatProjectTypeLabel(type)}</span>
              <span className="text-[var(--text-secondary)] tabular-nums">{count} projects</span>
            </div>
            <Progress percent={percent} strokeColor={chartColorForProjectType(type)} showInfo={false} />
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] m-0 mb-3">Risk Distribution</h4>
        {riskData.map(({ level, count, percent }) => (
          <div key={level} style={{ marginBottom: 8 }}>
            <div className="flex justify-between mb-1 text-sm text-[var(--text-primary)]">
              <span className="capitalize">{level} risk</span>
              <span className="text-[var(--text-secondary)] tabular-nums">{count} projects</span>
            </div>
            <Progress percent={percent} strokeColor={riskColors[level]} showInfo={false} />
          </div>
        ))}
      </div>
    </Card>
  )
}
