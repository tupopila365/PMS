import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Button, Dropdown } from 'antd'
import { ProjectOutlined, CheckCircleOutlined, DollarOutlined, WarningOutlined, ExportOutlined } from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import { projectService } from '../../services/projectService'
import { RiskAlertsBanner } from '../../components/dashboard/RiskAlertsBanner'
import { PortfolioAnalytics } from '../../components/dashboard/PortfolioAnalytics'
import { PageHeader } from '../../components/layout/PageHeader'
import { KPICard } from '../../components/ui/KPICard'
import { PageLoader } from '../../components/ui/PageLoader'
import { PortfolioDisciplineStatusMatrix } from '../../components/portfolio/PortfolioDisciplineStatusMatrix'
import { exportProjectsToCSV } from '../../utils/exportUtils'
import { useProjectContext } from '../../context/ProjectContext'

export function ProjectPortfolio() {
  const { selectedProjectId } = useProjectContext()
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis', selectedProjectId],
    queryFn: () => dashboardService.getKPIs(selectedProjectId),
  })

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const scopedProjects = useMemo(
    () => (selectedProjectId ? projects.filter((p) => p.id === selectedProjectId) : projects),
    [projects, selectedProjectId],
  )

  const chartData = useMemo(() => {
    const list = scopedProjects
    return list.reduce<{ name: string; value: number }[]>((acc, p) => {
      const existing = acc.find((x) => x.name === p.type)
      if (existing) existing.value++
      else acc.push({ name: p.type, value: 1 })
      return acc
    }, [])
  }, [scopedProjects])

  if (isLoading || !kpis) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader
        title="Project Portfolio"
        subtitle="Executive overview, including discipline × pipeline totals (respects the header project filter)."
        actions={
          <Dropdown
            menu={{
              items: [
                {
                  key: 'csv',
                  label: 'Portfolio Projects (CSV)',
                  onClick: () => exportProjectsToCSV(scopedProjects),
                },
              ],
            }}
          >
            <Button icon={<ExportOutlined />}>Export</Button>
          </Dropdown>
        }
      />

      <RiskAlertsBanner />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <KPICard title="Total Projects" value={kpis.totalProjects} prefix={<ProjectOutlined />} variant="default" />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard title="On Track" value={kpis.onTrackCount} prefix={<CheckCircleOutlined />} variant="success" />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard title="At Risk" value={kpis.atRiskCount} prefix={<WarningOutlined />} variant="danger" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total estimated cost" value={kpis.totalBudget} prefix={<DollarOutlined />} variant="success" formatter={(v) => `$${Number(v).toLocaleString()}`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Aggregate Variance" value={kpis.aggregateVariance} prefix={<DollarOutlined />} variant="default" formatter={(v) => `$${Number(v).toLocaleString()}`} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Progress by Project Type"
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
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <PortfolioAnalytics />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <PortfolioDisciplineStatusMatrix
            projects={scopedProjects}
            loading={projectsLoading}
            filteredToSingleProject={Boolean(selectedProjectId)}
          />
        </Col>
      </Row>
    </div>
  )
}
