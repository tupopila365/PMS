import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { RACIMatrix } from '../../components/raci/RACIMatrix'
import { PageHeader } from '../../components/layout/PageHeader'
import { raciService } from '../../services/raciService'
import { projectService } from '../../services/projectService'

export function ProjectRACI() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: entries = [] } = useQuery({
    queryKey: ['raci', id],
    queryFn: () => raciService.getEntries(id!),
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
        title="RACI Chart"
        subtitle={project?.name ? `${project.name} — Responsible, Accountable, Consulted, Informed` : undefined}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <RACIMatrix entries={entries} />
      </Card>
    </div>
  )
}
