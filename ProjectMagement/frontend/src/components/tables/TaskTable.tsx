import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Select, Button, DatePicker, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { taskService } from '../../services/taskService'
import { CreateTaskModal } from '../tasks/CreateTaskModal'
import { mockUsers } from '../../mocks/data'
import type { Task, TaskStatus } from '../../types'
import dayjs from 'dayjs'

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const userOptions = mockUsers.map((u) => ({ value: u.id, label: u.name }))

interface TaskTableProps {
  projectId?: string
}

export function TaskTable({ projectId }: TaskTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getTasks(projectId),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (title: string, record: Task) => (
      <span>{title}{record.isMilestone && <Tag color="blue" style={{ marginLeft: 8 }}>M</Tag>}</span>
    )},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: TaskStatus, record: Task) => (
      <Select
        value={status}
        options={statusOptions}
        onChange={(value: TaskStatus) => updateMutation.mutate({ id: record.id, updates: { status: value } })}
        style={{ width: 140 }}
      />
    )},
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: string[] | undefined, record: Task) => (
        <Select
          mode="multiple"
          value={assignedTo?.length ? assignedTo : undefined}
          placeholder="Unassigned"
          options={userOptions}
          allowClear
          style={{ width: 200 }}
          onChange={(value) => updateMutation.mutate({ id: record.id, updates: { assignedTo: value?.length ? value : undefined } })}
        />
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate: string | undefined, record: Task) => (
        <DatePicker
          value={dueDate ? dayjs(dueDate) : null}
          placeholder="Set date"
          style={{ width: 140 }}
          onChange={(_, dateStr) => updateMutation.mutate({ id: record.id, updates: { dueDate: (dateStr as string) || undefined } })}
        />
      ),
    },
  ]

  return (
    <div>
      {projectId && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add Task
          </Button>
        </div>
      )}
      <Table columns={columns} dataSource={tasks || []} rowKey="id" loading={isLoading} pagination={{ pageSize: 10, showSizeChanger: true }} />
      {projectId && (
        <CreateTaskModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
      )}
    </div>
  )
}
