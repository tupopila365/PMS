import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Table } from 'antd'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import { PageHeader } from '../../components/layout/PageHeader'
import type { Task } from '../../types'
import { formatProjectTypeLabel } from '../../utils/projectType'

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#dc2626']

export function Reports() {
  const navigate = useNavigate()
  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.getKPIs,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(),
  })

  const completionData = useMemo(() => {
    const byType: Record<string, { total: number; completed: number }> = {}
    for (const p of projects) {
      const typeTasks = tasks.filter((t) => t.projectId === p.id)
      const total = typeTasks.length || 1
      const completed = typeTasks.filter((t) => t.status === 'completed').length
      if (!byType[p.type]) byType[p.type] = { total: 0, completed: 0 }
      byType[p.type].total += total
      byType[p.type].completed += completed
    }
    return Object.entries(byType)
      .filter(([, { total }]) => total > 0)
      .map(([type, { total, completed }]) => ({
        name: formatProjectTypeLabel(type),
        value: Math.round((completed / total) * 100),
      }))
  }, [projects, tasks])

  const milestones = useMemo(() => {
    return tasks
      .filter((t) => t.isMilestone)
      .map((t) => ({ ...t, projectName: projects.find((p) => p.id === t.projectId)?.name }))
  }, [tasks, projects])

  const budgetData = [
    { name: 'Budget', value: kpis?.totalBudget || 0 },
    { name: 'Paid', value: kpis?.totalPaid || 0 },
    { name: 'Outstanding', value: kpis?.outstandingBalance || 0 },
  ]

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Project and budget analytics." />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Completion by Project Type"
            styles={{
              header: { borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' },
              body: { padding: '20px 24px' },
            }}
            style={{ borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
          >
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <defs>
                  {COLORS.map((color, i) => (
                    <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={completionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius={0}
                  outerRadius={95}
                  stroke="var(--border)"
                  strokeWidth={1}
                  label={false}
                >
                  {completionData.map((_, i) => (
                    <Cell key={i} fill={`url(#pieGrad${i % COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  layout="vertical"
                  align="center"
                  wrapperStyle={{ paddingTop: 12, width: '100%', color: 'var(--text-primary)' }}
                  formatter={(value) => {
                    const row = completionData.find((d) => d.name === value)
                    return row ? `${row.name}: ${row.value}%` : value
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Budget Overview"
            styles={{
              header: { borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' },
              body: { padding: '20px 24px' },
            }}
            style={{ borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => `$${Number(v).toLocaleString()}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                    background: 'var(--surface-elevated)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
                <Bar dataKey="value" fill="url(#barGradient)" name="Amount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24}>
          <Card
            title="Milestone Report"
            styles={{
              header: { borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' },
              body: { padding: '20px 24px' },
            }}
            style={{ borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
          >
            <Table
              dataSource={milestones}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Milestone', dataIndex: 'title', key: 'title' },
                { title: 'Project', dataIndex: 'projectName', key: 'projectName' },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => s?.replace('_', ' ') },
                { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 110 },
                { title: 'Action', key: 'action', width: 100, render: (_, r: Task) => <a onClick={() => navigate(`/projects/${r.projectId}`)}>View Project</a> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
