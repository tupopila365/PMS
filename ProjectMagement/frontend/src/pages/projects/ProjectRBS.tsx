import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { RBSTree } from '../../components/resources/RBSTree'
import { PageHeader } from '../../components/layout/PageHeader'
import { resourceService } from '../../services/resourceService'
import { projectService } from '../../services/projectService'

export function ProjectRBS() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', id],
    queryFn: () => resourceService.getResources(id!),
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
        title="Resource Breakdown Structure"
        subtitle={project?.name}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <RBSTree resources={resources} />
      </Card>
    </div>
  )
}
