import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, Button } from 'antd'
import { UnorderedListOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { NetworkDiagram } from '../../components/network/NetworkDiagram'
import { PageHeader } from '../../components/layout/PageHeader'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'

export function NetworkView() {
  const navigate = useNavigate()
  const [projectFilter, setProjectFilter] = useState<string | undefined>()

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectFilter],
    queryFn: () => taskService.getTasks(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  return (
    <div>
      <PageHeader
        title="Network Diagram (PERT / CPM)"
        actions={
          <>
            <Select
              placeholder="All Projects"
              allowClear
              style={{ width: 200 }}
              value={projectFilter}
              onChange={setProjectFilter}
              options={[{ label: 'All Projects', value: undefined }, ...projects.map((p) => ({ label: p.name, value: p.id }))]}
            />
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/tasks')}>
              List
            </Button>
            <Button icon={<ProjectOutlined />} onClick={() => navigate('/tasks/gantt')}>
              Gantt
            </Button>
          </>
        }
      />
      <NetworkDiagram tasks={tasks} />
    </div>
  )
}
