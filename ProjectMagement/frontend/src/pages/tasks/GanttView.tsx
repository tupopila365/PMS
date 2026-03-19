import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, Button, Alert } from 'antd'
import { UnorderedListOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { GanttChart } from '../../components/gantt/GanttChart'
import { PageHeader } from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/PageLoader'
import { ErrorBoundary } from '../../components/ui/ErrorBoundary'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'
import type { Task } from '../../types'

export function GanttView() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectFilter, setProjectFilter] = useState<string | undefined>()

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks', projectFilter],
    queryFn: () => taskService.getTasks(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

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

  const tasksWithDates = tasks.filter((t) => t.startDate || t.endDate || t.dueDate)

  return (
    <div className="gantt-page flex flex-col min-h-0">
      <PageHeader
        title="Gantt Chart"
        subtitle="Timeline view of project tasks and dependencies."
        actions={
          <>
            <Select
              placeholder="All Projects"
              allowClear
              className="w-[200px]"
              value={projectFilter}
              onChange={setProjectFilter}
              options={[{ label: 'All Projects', value: undefined }, ...projects.map((p) => ({ label: p.name, value: p.id }))]}
            />
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/tasks')}>
              List
            </Button>
            <Button icon={<ProjectOutlined />} onClick={() => navigate('/tasks/board')}>
              Board
            </Button>
          </>
        }
      />
      <div className="mt-4 flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="min-h-[320px] flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <PageLoader />
          </div>
        ) : isError ? (
          <Alert
            type="error"
            message="Failed to load tasks"
            description="Please try again or check your connection."
            showIcon
            className="rounded-xl"
          />
        ) : (
          <ErrorBoundary>
            <GanttChart tasks={tasksWithDates.length ? tasksWithDates : tasks} onDateChange={handleDateChange} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
