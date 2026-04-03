import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Input, Select, Card, Row, Col } from 'antd'
import { PlusOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { usePermissions } from '../../hooks/usePermissions'
import type { Project, RiskLevel } from '../../types'
import { formatProjectTypeLabel, tagColorForProjectType } from '../../utils/projectType'

const riskColors: Record<RiskLevel, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
}

export function ProjectList() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string | undefined>()
  const [filterRegion, setFilterRegion] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterType && p.type !== filterType) return false
      if (filterRegion && p.region !== filterRegion) return false
      if (filterStatus && p.status !== filterStatus) return false
      return true
    })
  }, [projects, search, filterType, filterRegion, filterStatus])

  const regions = useMemo(() => [...new Set(projects?.map((p) => p.region).filter(Boolean))] as string[], [projects])
  const statuses = useMemo(() => [...new Set(projects?.map((p) => p.status).filter(Boolean))] as string[], [projects])
  const types = useMemo(() => [...new Set(projects?.map((p) => p.type).filter(Boolean))] as string[], [projects])

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name: string, record: Project) => <a onClick={() => navigate(`/projects/${record.id}`)} className="text-[var(--color-primary)] hover:underline font-medium">{name}</a> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={tagColorForProjectType(type)}>{formatProjectTypeLabel(type)}</Tag> },
    { title: 'Region', dataIndex: 'region', key: 'region' },
    { title: 'Client', dataIndex: 'client', key: 'client' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag>{status || 'active'}</Tag> },
    { title: 'Risk', dataIndex: 'riskLevel', key: 'riskLevel', render: (r: RiskLevel) => r ? <Tag color={riskColors[r]}>{r}</Tag> : '-' },
    { title: 'Est. cost', dataIndex: 'budget', key: 'budget', render: (r: number) => r ? `$${r.toLocaleString()}` : '-' },
    {
      title: 'Actual cost',
      dataIndex: 'actualCost',
      key: 'actualCost',
      render: (r: number | undefined) => (r != null && r > 0 ? `$${r.toLocaleString()}` : '—'),
    },
    { title: '', key: 'action', width: 80, render: (_: unknown, record: Project) => <Button type="link" size="small" onClick={() => navigate(`/projects/${record.id}`)}>View</Button> },
  ]

  return (
    <div>
      <PageHeader
        title="Projects"
        actions={
          can('projects:create') ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>
              New Project
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-6 rounded-xl border border-[var(--border)]" styles={{ body: { padding: 16 } }}>
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search projects..."
            prefix={<SearchOutlined className="text-[var(--text-muted)]" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            allowClear
          />
          <Select
            placeholder="Type"
            value={filterType}
            onChange={setFilterType}
            allowClear
            showSearch
            optionFilterProp="label"
            className="w-[180px]"
            options={types.map((t) => ({ value: t, label: formatProjectTypeLabel(t) }))}
          />
          <Select placeholder="Region" value={filterRegion} onChange={setFilterRegion} allowClear className="w-[150px]" options={regions.map((r) => ({ value: r, label: r }))} />
          <Select placeholder="Status" value={filterStatus} onChange={setFilterStatus} allowClear className="w-[150px]" options={statuses.map((s) => ({ value: s, label: s }))} />
          <div className="ml-auto flex gap-1">
            <Button type={viewMode === 'list' ? 'primary' : 'default'} icon={<UnorderedListOutlined />} onClick={() => setViewMode('list')} size="small">List</Button>
            <Button type={viewMode === 'grid' ? 'primary' : 'default'} icon={<AppstoreOutlined />} onClick={() => setViewMode('grid')} size="small">Grid</Button>
          </div>
        </div>
      </Card>

      {viewMode === 'list' ? (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: (
                <EmptyState
                  message="No projects found"
                  description="Try adjusting your filters or create a new project."
                  action={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>New Project</Button>}
                />
              ),
            }}
          />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredProjects.map((p) => (
            <Col key={p.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate(`/projects/${p.id}`)}
                className="rounded-xl border border-[var(--border)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Card.Meta
                  title={<span className="font-semibold text-[var(--text-primary)]">{p.name}</span>}
                  description={
                    <div className="mt-2">
                      <div className="flex gap-2 flex-wrap">
                        <Tag color={tagColorForProjectType(p.type)}>{formatProjectTypeLabel(p.type)}</Tag>
                        {p.riskLevel && <Tag color={riskColors[p.riskLevel]}>{p.riskLevel}</Tag>}
                      </div>
                      {p.budget && <div className="mt-2 text-sm text-[var(--text-secondary)]">Estimated: ${p.budget.toLocaleString()}</div>}
                      {p.actualCost != null && p.actualCost > 0 && (
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">Actual: ${p.actualCost.toLocaleString()}</div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
