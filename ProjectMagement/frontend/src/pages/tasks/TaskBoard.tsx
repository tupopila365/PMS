import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'
import { KanbanBoard } from '../../components/tables/KanbanBoard'
import { PageHeader } from '../../components/layout/PageHeader'
import { taskService } from '../../services/taskService'
import { useProjectContext } from '../../context/ProjectContext'
import type { TaskStatus } from '../../types'
import { isTaskArchived } from '../../utils/taskFilters'

export function TaskBoard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectedProjectId } = useProjectContext()
  const [showArchivedColumn, setShowArchivedColumn] = useState(false)
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', selectedProjectId],
    queryFn: () => taskService.getTasks(selectedProjectId),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<{ status: TaskStatus; archived: boolean }> }) =>
      taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateMutation.mutate({ id: taskId, updates: { status: newStatus } })
  }

  const handleArchiveChange = (taskId: string, archived: boolean) => {
    updateMutation.mutate({ id: taskId, updates: { archived } })
  }

  const archivedHiddenCount = useMemo(() => (tasks || []).filter((t) => isTaskArchived(t)).length, [tasks])

  return (
    <div>
      <PageHeader
        title="Task Board"
        actions={
          <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/tasks')}>
            List View
          </Button>
        }
      />
      <KanbanBoard
        tasks={tasks || []}
        onStatusChange={handleStatusChange}
        onArchiveChange={handleArchiveChange}
        showArchivedColumn={showArchivedColumn}
        onToggleShowArchivedColumn={setShowArchivedColumn}
        archivedHiddenCount={archivedHiddenCount}
        loading={isLoading}
      />
    </div>
  )
}
