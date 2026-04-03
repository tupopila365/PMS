import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Statistic, Progress, Skeleton } from 'antd'
import { ProjectOutlined, CheckCircleOutlined, DollarOutlined, FundOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { RecentActivity } from '../../components/dashboard/RecentActivity'
import { ScheduleAttention } from '../../components/dashboard/ScheduleAttention'
import { PageHeader } from '../../components/layout/PageHeader'
import { useProjectContext } from '../../context/ProjectContext'

const cardSurface = 'rounded-xl border border-[var(--border)]'

export function Dashboard() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { data: kpis, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'kpis', selectedProjectId],
    queryFn: () => dashboardService.getKPIs(selectedProjectId),
  })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Your overview at a glance." />
        <Row gutter={[16, 16]}>
          {[0, 1, 2, 3].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card className={cardSurface}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} lg={12}>
            <Card className={cardSurface} title="Estimated vs paid">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className={cardSurface}>
              <Skeleton active paragraph={{ rows: 4 }} title={{ width: '40%' }} />
            </Card>
          </Col>
        </Row>
      </div>
    )
  }

  if (isError || !kpis) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Your overview at a glance." />
        <Card className={cardSurface}>
          <p className="text-[var(--text-secondary)] m-0">Unable to load dashboard data. Try again later.</p>
        </Card>
      </div>
    )
  }

  const budgetPercent = kpis.totalBudget > 0 ? Math.round((kpis.totalPaid / kpis.totalBudget) * 100) : 0

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your overview at a glance." />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/portfolio')} className={`${cardSurface} cursor-pointer`}>
            <Statistic title="Total Projects" value={kpis.totalProjects} prefix={<ProjectOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/portfolio')} className={`${cardSurface} cursor-pointer`}>
            <Statistic title="Active Projects" value={kpis.activeProjects} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={cardSurface}>
            <Statistic title="Completion Rate" value={kpis.completionRate} suffix="%" prefix={<FundOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/finance/invoices')} className={`${cardSurface} cursor-pointer`}>
            <Statistic title="Outstanding Balance" value={kpis.outstandingBalance} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card className={cardSurface} title="Estimated vs paid">
            <Progress percent={budgetPercent} status="active" />
            <div className="mt-4 flex justify-between flex-wrap gap-2">
              <span className="text-[var(--text-secondary)]">Paid: ${kpis.totalPaid.toLocaleString()}</span>
              <span className="text-[var(--text-secondary)]">Total estimated: ${kpis.totalBudget.toLocaleString()}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <RecentActivity />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24}>
          <ScheduleAttention />
        </Col>
      </Row>
    </div>
  )
}
