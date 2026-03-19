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
import { exportProjectsToCSV } from '../../utils/exportUtils'

export function ProjectPortfolio() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.getKPIs,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const chartData = (projects || []).reduce<{ name: string; value: number }[]>((acc, p) => {
    const existing = acc.find((x) => x.name === p.type)
    if (existing) existing.value++
    else acc.push({ name: p.type, value: 1 })
    return acc
  }, [])

  if (isLoading || !kpis) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader
        title="Project Portfolio"
        subtitle="Executive overview of all active infrastructure projects."
        actions={
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: 'Portfolio Projects (CSV)', onClick: () => projects && exportProjectsToCSV(projects) },
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
          <KPICard title="Total Budget" value={kpis.totalBudget} prefix={<DollarOutlined />} variant="success" formatter={(v) => `$${Number(v).toLocaleString()}`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Aggregate Variance" value={kpis.aggregateVariance} prefix={<DollarOutlined />} variant="default" formatter={(v) => `$${Number(v).toLocaleString()}`} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Progress by Project Type" styles={{ header: { borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }, body: { padding: '20px 24px' } }} style={{ borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="value" fill="url(#portfolioBarGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <PortfolioAnalytics />
        </Col>
      </Row>
    </div>
  )
}
