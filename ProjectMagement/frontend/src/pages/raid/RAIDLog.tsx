import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Tabs, Table, Result } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { raidService } from '../../services/raidService'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/PageLoader'
import type { RAIDItem } from '../../types'

function raidLoadErrorMessage(error: unknown): string {
  let msg = 'The RAID log could not be loaded. Check that the API is running and you are logged in.'
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      msg = 'Your session may have expired. Sign in again and retry.'
    } else if (error.response?.status === 404) {
      msg = 'RAID data was not found for this project.'
    } else if (error.response?.status != null) {
      msg = `Request failed (${error.response.status}).`
    } else if (error.message) {
      msg = error.message
    }
  } else if (error instanceof Error && error.message) {
    msg = error.message
  }
  return msg
}

export function RAIDLog() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['raid', id],
    queryFn: () => raidService.getItems(id!),
    enabled: !!id,
    retry: 1,
  })

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  const items: RAIDItem[] = !isError && data != null ? data : []
  const byType = (type: RAIDItem['type']) => items.filter((i) => i.type === type)

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 100 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
  ]

  if (!id) return <div>Project not found</div>

  const header = (
    <PageHeader
      title="RAID Log"
      subtitle={project?.name ? `${project.name} — Risks, Assumptions, Issues, Dependencies` : undefined}
      leading={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
          Back
        </Button>
      }
    />
  )

  if (isPending) {
    return (
      <div>
        {header}
        <PageLoader />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        {header}
        <Card styles={{ body: { padding: 16 } }}>
          <Result
            status="error"
            title="Could not load RAID log"
            subTitle={raidLoadErrorMessage(error)}
            extra={
              <Button type="primary" onClick={() => refetch()} loading={isFetching}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div>
      {header}
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
