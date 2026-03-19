import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { WBSTree } from '../../components/wbs/WBSTree'
import { PageHeader } from '../../components/layout/PageHeader'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'

export function ProjectWBS() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getTasks(id!),
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
        title="Work Breakdown Structure"
        subtitle={project?.name}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <WBSTree tasks={tasks} />
      </Card>
    </div>
  )
}
