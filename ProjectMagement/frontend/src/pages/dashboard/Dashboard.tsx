import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Statistic, Progress } from 'antd'
import { ProjectOutlined, CheckCircleOutlined, DollarOutlined, FundOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { RecentActivity } from '../../components/dashboard/RecentActivity'

export function Dashboard() {
  const navigate = useNavigate()
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.getKPIs,
  })

  if (isLoading || !kpis) {
    return <div>Loading dashboard...</div>
  }

  const budgetPercent = kpis.totalBudget > 0 ? Math.round((kpis.totalPaid / kpis.totalBudget) * 100) : 0

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 4 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Your overview at a glance.</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/portfolio')} style={{ cursor: 'pointer' }}>
            <Statistic title="Total Projects" value={kpis.totalProjects} prefix={<ProjectOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/portfolio')} style={{ cursor: 'pointer' }}>
            <Statistic title="Active Projects" value={kpis.activeProjects} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Completion Rate" value={kpis.completionRate} suffix="%" prefix={<FundOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/finance/invoices')} style={{ cursor: 'pointer' }}>
            <Statistic title="Outstanding Balance" value={kpis.outstandingBalance} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Budget Overview">
            <Progress percent={budgetPercent} status="active" />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span>Paid: ${kpis.totalPaid.toLocaleString()}</span>
              <span>Total: ${kpis.totalBudget.toLocaleString()}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <RecentActivity />
        </Col>
      </Row>
    </div>
  )
}
