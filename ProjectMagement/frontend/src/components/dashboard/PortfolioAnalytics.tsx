import { useQuery } from '@tanstack/react-query'
import { Card, Progress } from 'antd'
import { projectService } from '../../services/projectService'
import { getProjectRiskLevelFromRisks } from '../../utils/projectRisk'
import type { ProjectType, RiskLevel } from '../../types'

const typeColors: Record<ProjectType, string> = {
  construction: '#52c41a',
  roads: '#13c2c2',
  railway: '#1890ff',
  buildings: '#fa8c16',
}

const riskColors: Record<RiskLevel, string> = {
  low: '#52c41a',
  medium: '#fa8c16',
  high: '#f5222d',
}

export function PortfolioAnalytics() {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const byType = (projects || []).reduce<Record<ProjectType, number>>(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1
      return acc
    },
    {} as Record<ProjectType, number>
  )

  const byRisk = (projects || []).reduce<Record<RiskLevel, number>>(
    (acc, p) => {
      const level = getProjectRiskLevelFromRisks(p.id, p.riskLevel) || 'low'
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
      styles={{
        header: { borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' },
        body: { padding: '20px 24px' },
      }}
      style={{ borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
    >
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 12 }}>Projects by Type</h4>
        {typeData.map(({ type, count, percent }) => (
          <div key={type} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
              <span>{count} projects</span>
            </div>
            <Progress percent={percent} strokeColor={typeColors[type as ProjectType]} showInfo={false} />
          </div>
        ))}
      </div>
      <div>
        <h4 style={{ marginBottom: 12 }}>Risk Distribution</h4>
        {riskData.map(({ level, count, percent }) => (
          <div key={level} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ textTransform: 'capitalize' }}>{level} Risk</span>
              <span>{count} projects</span>
            </div>
            <Progress percent={percent} strokeColor={riskColors[level]} showInfo={false} />
          </div>
        ))}
      </div>
    </Card>
  )
}
