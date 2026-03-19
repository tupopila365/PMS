import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Tabs, Table } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { raidService } from '../../services/raidService'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'
import type { RAIDItem } from '../../types'

export function RAIDLog() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: items = [] } = useQuery({
    queryKey: ['raid', id],
    queryFn: () => raidService.getItems(id!),
    enabled: !!id,
  })

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  const byType = (type: RAIDItem['type']) => items.filter((i) => i.type === type)

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 100 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
  ]

  if (!id) return <div>Project not found</div>

  return (
    <div>
      <PageHeader
        title="RAID Log"
        subtitle={project?.name ? `${project.name} — Risks, Assumptions, Issues, Dependencies` : undefined}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <Tabs
          items={[
            { key: 'risk', label: `Risks (${byType('risk').length})`, children: <Table dataSource={byType('risk')} rowKey="id" columns={columns} size="small" /> },
            { key: 'assumption', label: `Assumptions (${byType('assumption').length})`, children: <Table dataSource={byType('assumption')} rowKey="id" columns={columns} size="small" /> },
            { key: 'issue', label: `Issues (${byType('issue').length})`, children: <Table dataSource={byType('issue')} rowKey="id" columns={columns} size="small" /> },
            { key: 'dependency', label: `Dependencies (${byType('dependency').length})`, children: <Table dataSource={byType('dependency')} rowKey="id" columns={columns} size="small" /> },
          ]}
        />
      </Card>
    </div>
  )
}
