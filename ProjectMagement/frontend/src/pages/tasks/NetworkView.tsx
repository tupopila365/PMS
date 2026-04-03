import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, Button, Space, Switch, Typography } from 'antd'
import { UnorderedListOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { NetworkDiagram } from '../../components/network/NetworkDiagram'
import { PageHeader } from '../../components/layout/PageHeader'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'
import { useProjectContext } from '../../context/ProjectContext'
import { countHiddenByDefault, filterTasksForDefaultViews } from '../../utils/taskFilters'

export function NetworkView() {
  const navigate = useNavigate()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    setProjectFilter(selectedProjectId)
  }, [selectedProjectId])

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectFilter],
    queryFn: () => taskService.getTasks(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const visibleTasks = useMemo(
    () => filterTasksForDefaultViews(tasks, { showCompleted, showArchived }),
    [tasks, showCompleted, showArchived]
  )
  const hiddenCounts = useMemo(() => countHiddenByDefault(tasks), [tasks])

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
              onChange={(v) => {
                setProjectFilter(v)
                setSelectedProjectId(v)
              }}
              options={[{ label: 'All Projects', value: undefined }, ...projects.map((p) => ({ label: p.name, value: p.id }))]}
            />
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/tasks')}>
              List
            </Button>
            <Button icon={<ProjectOutlined />} onClick={() => navigate('/tasks/gantt')}>
              Gantt
            </Button>
            <Space size="small" className="ml-1 border-l border-[var(--border)] pl-3">
              <Switch size="small" checked={showCompleted} onChange={setShowCompleted} />
              <Typography.Text type="secondary" className="text-xs whitespace-nowrap">
                Completed
              </Typography.Text>
              <Switch size="small" checked={showArchived} onChange={setShowArchived} />
              <Typography.Text type="secondary" className="text-xs whitespace-nowrap">
                Archived
              </Typography.Text>
            </Space>
          </>
        }
      />
      {!showCompleted || !showArchived ? (
        <Typography.Text type="secondary" className="text-xs block mb-2">
          {!showCompleted && hiddenCounts.completed > 0 && `${hiddenCounts.completed} completed hidden`}
          {!showCompleted && !showArchived && hiddenCounts.completed > 0 && hiddenCounts.archived > 0 && ' · '}
          {!showArchived && hiddenCounts.archived > 0 && `${hiddenCounts.archived} archived hidden`}
        </Typography.Text>
      ) : null}
      <NetworkDiagram tasks={visibleTasks} />
    </div>
  )
}
