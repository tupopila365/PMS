import { Modal, Form, Input, Select, Button, DatePicker } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../../services/taskService'
import { userService } from '../../services/userService'
import type { TaskStatus } from '../../types'
import dayjs from 'dayjs'

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  projectId: string
}

export function CreateTaskModal({ open, onClose, projectId }: CreateTaskModalProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  })
  const userOptions = users.map((u) => ({ value: u.id, label: u.name }))

  const createMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      form.resetFields()
      onClose()
    },
  })

  const onFinish = (values: { title: string; status?: TaskStatus; assignedTo?: string[]; dueDate?: dayjs.Dayjs }) => {
    createMutation.mutate({
      projectId,
      title: values.title,
      status: values.status || 'not_started',
      assignedTo: values.assignedTo?.length ? values.assignedTo : undefined,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
    })
  }

  return (
    <Modal title="Add Task" open={open} onCancel={onClose} footer={null}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
          <Input placeholder="Enter task title" />
        </Form.Item>
        <Form.Item name="status" label="Status" initialValue="not_started">
          <Select options={statusOptions} />
        </Form.Item>
        <Form.Item name="assignedTo" label="Assigned To">
          <Select mode="multiple" placeholder="Select assignees" options={userOptions} allowClear />
        </Form.Item>
        <Form.Item name="dueDate" label="Due Date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Add</Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
