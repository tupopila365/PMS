import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Select, Button, DatePicker, Tag, Switch, Space, Typography } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import { taskService } from '../../services/taskService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import { CreateTaskModal } from '../tasks/CreateTaskModal'
import type { Task, TaskStatus } from '../../types'
import dayjs from 'dayjs'
import { countHiddenByDefault, filterTasksForDefaultViews, isTaskArchived } from '../../utils/taskFilters'

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

interface TaskTableProps {
  projectId?: string
}

export function TaskTable({ projectId }: TaskTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const usersCompanyId = user?.companyId
  const { data: users = [] } = useQuery({
    queryKey: ['users', usersCompanyId],
    queryFn: () => userService.getUsers(usersCompanyId),
    enabled: Boolean(usersCompanyId),
  })
  const userOptions = users.map((u) => ({ value: u.id, label: u.name }))
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getTasks(projectId),
  })

  const filteredTasks = useMemo(
    () => filterTasksForDefaultViews(tasks || [], { showCompleted, showArchived }),
    [tasks, showCompleted, showArchived]
  )
  const hiddenCounts = useMemo(() => countHiddenByDefault(tasks || []), [tasks])

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (title: string, record: Task) => (
      <span>
        {title}
        {record.isMilestone && <Tag color="blue" style={{ marginLeft: 8 }}>M</Tag>}
        {isTaskArchived(record) && (
          <Tag icon={<InboxOutlined />} color="default" style={{ marginLeft: 8 }}>
            Archived
          </Tag>
        )}
      </span>
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
    {
      title: 'Sample',
      key: 'sampleRequired',
      width: 88,
      render: (_: unknown, record: Task) => (
        <Switch
          size="small"
          checked={Boolean(record.sampleRequired)}
          onChange={(checked) => updateMutation.mutate({ id: record.id, updates: { sampleRequired: checked } })}
        />
      ),
    },
    {
      title: 'Approval',
      key: 'approvalRequired',
      width: 96,
      render: (_: unknown, record: Task) => (
        <Switch
          size="small"
          checked={Boolean(record.approvalRequired)}
          onChange={(checked) => updateMutation.mutate({ id: record.id, updates: { approvalRequired: checked } })}
        />
      ),
    },
    {
      title: 'Archive',
      key: 'archived',
      width: 108,
      render: (_: unknown, record: Task) =>
        isTaskArchived(record) ? (
          <Button type="link" size="small" className="px-0" onClick={() => updateMutation.mutate({ id: record.id, updates: { archived: false } })}>
            Unarchive
          </Button>
        ) : (
          <Button type="link" size="small" className="px-0" onClick={() => updateMutation.mutate({ id: record.id, updates: { archived: true } })}>
            Archive
          </Button>
        ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {projectId && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add Task
          </Button>
        )}
        <Space size="large" wrap className="text-[var(--text-muted)]">
          <Space size="small">
            <Switch size="small" checked={showCompleted} onChange={setShowCompleted} id="task-show-completed" />
            <Typography.Text type="secondary" className="text-xs">
              Show completed
            </Typography.Text>
          </Space>
          <Space size="small">
            <Switch size="small" checked={showArchived} onChange={setShowArchived} id="task-show-archived" />
            <Typography.Text type="secondary" className="text-xs">
              Show archived
            </Typography.Text>
          </Space>
        </Space>
        {!showCompleted || !showArchived ? (
          <Typography.Text type="secondary" className="text-xs">
            {!showCompleted && hiddenCounts.completed > 0 && `${hiddenCounts.completed} completed hidden`}
            {!showCompleted && !showArchived && hiddenCounts.completed > 0 && hiddenCounts.archived > 0 && ' · '}
            {!showArchived && hiddenCounts.archived > 0 && `${hiddenCounts.archived} archived hidden`}
          </Typography.Text>
        ) : null}
      </div>
      <Table columns={columns} dataSource={filteredTasks} rowKey="id" loading={isLoading} pagination={{ pageSize: 10, showSizeChanger: true }} />
      {projectId && (
        <CreateTaskModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
      )}
    </div>
  )
}
