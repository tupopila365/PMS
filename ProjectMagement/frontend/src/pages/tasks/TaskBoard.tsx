import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'
import { KanbanBoard } from '../../components/tables/KanbanBoard'
import { PageHeader } from '../../components/layout/PageHeader'
import { taskService } from '../../services/taskService'
import type { TaskStatus } from '../../types'

export function TaskBoard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status: TaskStatus } }) => taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateMutation.mutate({ id: taskId, updates: { status: newStatus } })
  }

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
      <KanbanBoard tasks={tasks || []} onStatusChange={handleStatusChange} loading={isLoading} />
    </div>
  )
}
