import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { CBSTree } from '../../components/cost/CBSTree'
import { PageHeader } from '../../components/layout/PageHeader'
import { costService } from '../../services/costService'
import { projectService } from '../../services/projectService'

export function ProjectCBS() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: categories = [] } = useQuery({
    queryKey: ['cost-categories', id],
    queryFn: () => costService.getCategories(id!),
    enabled: !!id,
  })

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  if (!id) return <div>Project not found</div>

  const totalBudget = categories.reduce((s, c) => s + c.budget, 0)
  const totalActual = categories.reduce((s, c) => s + c.actualCost, 0)

  return (
    <div>
      <PageHeader
        title="Cost Breakdown Structure"
        subtitle={project?.name ? `${project.name} — Total: $${totalBudget.toLocaleString()} | Actual: $${totalActual.toLocaleString()}` : undefined}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <CBSTree categories={categories} />
      </Card>
    </div>
  )
}
