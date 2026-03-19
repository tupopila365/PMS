import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/PageLoader'
import { EVMDashboard } from '../../components/evm/EVMDashboard'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'
import { timesheetService } from '../../services/timesheetService'
import { costService } from '../../services/costService'

export function ProjectEVM() {
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

  const { data: timesheetEntries = [] } = useQuery({
    queryKey: ['timesheets', id],
    queryFn: () => timesheetService.getEntries(id!),
    enabled: !!id,
  })

  const { data: costCategories = [] } = useQuery({
    queryKey: ['cost-categories', id],
    queryFn: () => costService.getCategories(id!),
    enabled: !!id,
  })

  if (!id) return <div>Project not found</div>
  if (!project) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader
        title="Earned Value Management"
        subtitle={`${project.name} — Integrated with Timesheets & CBS`}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <EVMDashboard project={project} tasks={tasks} timesheetEntries={timesheetEntries} costCategories={costCategories} />
    </div>
  )
}
