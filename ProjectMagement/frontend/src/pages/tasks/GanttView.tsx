import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, Button, Alert, Space, Switch, Typography } from 'antd'
import { UnorderedListOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { GanttChart } from '../../components/gantt/GanttChart'
import { PageHeader } from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/PageLoader'
import { ErrorBoundary } from '../../components/ui/ErrorBoundary'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'
import type { Task } from '../../types'
import { useProjectContext } from '../../context/ProjectContext'
import { countHiddenByDefault, filterTasksForDefaultViews } from '../../utils/taskFilters'

export function GanttView() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    setProjectFilter(selectedProjectId)
  }, [selectedProjectId])

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks', projectFilter],
    queryFn: () => taskService.getTasks(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const visibleTasks = useMemo(
    () => filterTasksForDefaultViews(tasks, { showCompleted, showArchived }),
    [tasks, showCompleted, showArchived]
  )
  const hiddenCounts = useMemo(() => countHiddenByDefault(tasks), [tasks])

  const handleDateChange = (task: Task, start: Date, end: Date) => {
    updateMutation.mutate({
      id: task.id,
      updates: {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        duration: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
      },
    })
  }

  const tasksWithDates = visibleTasks.filter((t) => t.startDate || t.endDate || t.dueDate)

  return (
    <div className="gantt-view-page flex flex-col flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden">
      <PageHeader
        className="shrink-0 !mb-3"
        title="Gantt"
        subtitle="Timeline, dependencies, and schedule — drag bars to adjust dates."
        actions={
          <>
            <Select
              placeholder="All Projects"
              allowClear
              className="w-[200px] min-w-[160px]"
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
            <Button icon={<ProjectOutlined />} onClick={() => navigate('/tasks/board')}>
              Board
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
        <Typography.Text type="secondary" className="text-xs block mb-2 shrink-0">
          {!showCompleted && hiddenCounts.completed > 0 && `${hiddenCounts.completed} completed hidden from chart`}
          {!showCompleted && !showArchived && hiddenCounts.completed > 0 && hiddenCounts.archived > 0 && ' · '}
          {!showArchived && hiddenCounts.archived > 0 && `${hiddenCounts.archived} archived hidden`}
        </Typography.Text>
      ) : null}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 min-h-0 flex items-center justify-center rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface-muted)]/30">
            <PageLoader />
          </div>
        ) : isError ? (
          <div>
            <Alert
              type="error"
              message="Failed to load tasks"
              description="Please try again or check your connection."
              showIcon
              className="rounded-xl"
            />
          </div>
        ) : (
          <ErrorBoundary>
            <div className="gantt-page-in-content flex-1 min-h-0 h-full flex flex-col min-w-0 overflow-hidden rounded-xl border border-[var(--border)] shadow-sm">
              <GanttChart tasks={tasksWithDates.length ? tasksWithDates : visibleTasks} onDateChange={handleDateChange} />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
