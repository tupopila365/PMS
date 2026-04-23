import { useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Button, Dropdown, Typography } from 'antd'
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

const { Title, Text } = Typography

function SectionHeader({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <header id={id} className="mb-4 max-w-3xl">
      <Title level={4} className="!mb-1.5 !mt-0 !text-[17px] !font-semibold text-[var(--text-primary)]">
        {title}
      </Title>
      <Text type="secondary" className="text-sm leading-relaxed block">
        {children}
      </Text>
    </header>
  )
}

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
    <div className="pb-8">
      <PageHeader
        title="Project Portfolio"
        subtitle="Executive view of your portfolio. Use the header project filter to focus on one project or see everything together."
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

      <div className="mt-6 space-y-12">
        {/* 1 — Numbers first */}
        <section aria-labelledby="portfolio-section-metrics">
          <SectionHeader id="portfolio-section-metrics" title="1 · Key metrics">
            High-level totals for the projects in view: size of the portfolio, delivery health, and estimated cost position.
          </SectionHeader>
          <div className="rounded-none border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <Row gutter={[12, 12]}>
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
                <KPICard
                  title="Total estimated cost"
                  value={kpis.totalBudget}
                  prefix={<DollarOutlined />}
                  variant="success"
                  formatter={(v) => `$${Number(v).toLocaleString()}`}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KPICard
                  title="Aggregate variance"
                  value={kpis.aggregateVariance}
                  prefix={<DollarOutlined />}
                  variant="default"
                  formatter={(v) => `$${Number(v).toLocaleString()}`}
                />
              </Col>
            </Row>
          </div>
        </section>

        {/* 2 — Action-oriented */}
        <section aria-labelledby="portfolio-section-alerts">
          <SectionHeader id="portfolio-section-alerts" title="2 · What needs attention">
            Automated risk alerts (schedule, cost, milestones). Click a row to open the risk register for that project.
          </SectionHeader>
          <RiskAlertsBanner />
        </section>

        {/* 3 — Charts side by side */}
        <section aria-labelledby="portfolio-section-charts">
          <SectionHeader id="portfolio-section-charts" title="3 · How work is spread">
            Compare volume by project type with how types and risk levels split across the same set of projects.
          </SectionHeader>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title="Projects by type (counts)"
                className="rounded-none border border-[var(--border)] shadow-none h-full"
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
                {chartData.length === 0 ? (
                  <Text type="secondary" className="text-sm">
                    No projects in this scope to chart.
                  </Text>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 0,
                          border: '1px solid var(--border)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                          background: 'var(--surface)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <Bar dataKey="value" name="Projects" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <PortfolioAnalytics cardTitle="Type & risk mix" />
            </Col>
          </Row>
        </section>

        {/* 4 — Detailed matrix last */}
        <section aria-labelledby="portfolio-section-matrix">
          <SectionHeader id="portfolio-section-matrix" title="4 · Discipline × pipeline">
            Detailed grid: how many projects (and combined budget) sit in each discipline and pipeline stage. Best for
            portfolio reviews; use the header filter to zoom to a single project when needed.
          </SectionHeader>
          <PortfolioDisciplineStatusMatrix
            projects={scopedProjects}
            loading={projectsLoading}
            filteredToSingleProject={Boolean(selectedProjectId)}
          />
        </section>
      </div>
    </div>
  )
}
