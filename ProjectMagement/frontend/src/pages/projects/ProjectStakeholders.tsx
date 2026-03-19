import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Table } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { StakeholderMap } from '../../components/stakeholders/StakeholderMap'
import { PageHeader } from '../../components/layout/PageHeader'
import { stakeholderService } from '../../services/stakeholderService'
import { projectService } from '../../services/projectService'

export function ProjectStakeholders() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders', id],
    queryFn: () => stakeholderService.getStakeholders(id!),
    enabled: !!id,
  })

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  if (!id) return <div>Project not found</div>

  return (
    <div>
      <PageHeader
        title="Stakeholder Mapping"
        subtitle={project?.name}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <StakeholderMap stakeholders={stakeholders} />
      <Card title="Stakeholder List" style={{ marginTop: 16 }} styles={{ body: { padding: 16 } }}>
        <Table
          dataSource={stakeholders}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Role', dataIndex: 'role', key: 'role' },
            { title: 'Power', dataIndex: 'power', key: 'power', width: 80 },
            { title: 'Interest', dataIndex: 'interest', key: 'interest', width: 80 },
            { title: 'Strategy', dataIndex: 'strategy', key: 'strategy' },
          ]}
        />
      </Card>
    </div>
  )
}
