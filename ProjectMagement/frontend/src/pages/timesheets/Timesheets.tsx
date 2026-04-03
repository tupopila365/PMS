import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Select, Card, Modal, Form, Input, InputNumber, DatePicker, message } from 'antd'
import { PlusOutlined, BellOutlined } from '@ant-design/icons'
import { timesheetService } from '../../services/timesheetService'
import { notificationService } from '../../services/notificationService'
import { userService } from '../../services/userService'
import { PageHeader } from '../../components/layout/PageHeader'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import { useProjectContext } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import type { TimesheetEntry } from '../../types'
import dayjs from 'dayjs'

export function Timesheets() {
  const { user } = useAuth()
  const companyId = user?.companyId
  const canRemind = user?.role === 'admin' || user?.role === 'project_manager'

  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  useEffect(() => {
    setProjectFilter(selectedProjectId)
  }, [selectedProjectId])

  const [modalOpen, setModalOpen] = useState(false)
  const [remindOpen, setRemindOpen] = useState(false)
  const [form] = Form.useForm()
  const [remindForm] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: entries = [] } = useQuery({
    queryKey: ['timesheets', projectFilter],
    queryFn: () => timesheetService.getEntries(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(),
  })

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => userService.getUsers(companyId),
    enabled: Boolean(companyId),
  })

  const createMutation = useMutation({
    mutationFn: (values: Omit<TimesheetEntry, 'id'>) => timesheetService.createEntry(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setModalOpen(false)
      form.resetFields()
      message.success('Time entry saved')
    },
    onError: () => message.error('Could not save entry'),
  })

  const remindMutation = useMutation({
    mutationFn: notificationService.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setRemindOpen(false)
      remindForm.resetFields()
      message.success('Reminder sent — they will see it in the bell until they log time for this task')
    },
    onError: () => message.error('Could not create reminder'),
  })

  const handleSubmit = (values: Record<string, unknown>) => {
    createMutation.mutate({
      projectId: values.projectId as string,
      taskId: values.taskId as string | undefined,
      userId: (values.userId as string) || user?.id || '1',
      hours: values.hours as number,
      date: (values.date as dayjs.Dayjs)?.format('YYYY-MM-DD') || new Date().toISOString().slice(0, 10),
      description: values.description as string,
    })
  }

  const submitReminder = (values: {
    targetUserId: string
    projectId: string
    taskId: string
    title?: string
    message?: string
  }) => {
    const proj = projects.find((p) => p.id === values.projectId)
    const t = tasks.find((tk) => tk.id === values.taskId)
    remindMutation.mutate({
      type: 'timesheet_reminder',
      title: values.title?.trim() || 'Log your time',
      message:
        values.message?.trim() ||
        `Please log your hours for ${proj?.name || 'project'} — ${t?.title || 'task'}.`,
      targetUserId: values.targetUserId,
      projectId: values.projectId,
      taskId: values.taskId,
    })
  }

  const [formProjectId, setFormProjectId] = useState<string | undefined>()
  const projectTasks = formProjectId ? tasks.filter((t) => t.projectId === formProjectId) : tasks

  const [remindProjectId, setRemindProjectId] = useState<string | undefined>()
  const remindTasks = remindProjectId ? tasks.filter((t) => t.projectId === remindProjectId) : []

  return (
    <div>
      <PageHeader
        title="Timesheets"
        actions={
          <>
            {canRemind && (
              <Button
                icon={<BellOutlined />}
                onClick={() => {
                  remindForm.resetFields()
                  setRemindOpen(true)
                }}
                style={{ marginRight: 8 }}
              >
                Remind user
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields()
                form.setFieldsValue({
                  date: dayjs(),
                  userId: user?.id,
                })
                setModalOpen(true)
              }}
            >
              Add Entry
            </Button>
          </>
        }
      />

      <Card styles={{ body: { padding: 16 } }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Select
            placeholder="Project"
            allowClear
            style={{ width: 200 }}
            value={projectFilter}
            onChange={(v) => {
              setProjectFilter(v)
              setSelectedProjectId(v)
            }}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
        </div>
        <Table<TimesheetEntry>
          dataSource={entries}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
            {
              title: 'Project',
              dataIndex: 'projectId',
              key: 'projectId',
              render: (id) => projects.find((p) => p.id === id)?.name || id,
            },
            {
              title: 'Task',
              dataIndex: 'taskId',
              key: 'taskId',
              render: (id) => tasks.find((t) => t.id === id)?.title || '-',
            },
            {
              title: 'User',
              dataIndex: 'userId',
              key: 'userId',
              width: 140,
              render: (id: string) => companyUsers.find((u) => u.id === id)?.name || id,
            },
            { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 80 },
            { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
          ]}
        />
      </Card>

      <Modal
        title="Add time entry"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {canRemind && (
            <Form.Item name="userId" label="User" rules={[{ required: true }]}>
              <Select
                placeholder="Who worked?"
                options={companyUsers.map((u) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
              />
            </Form.Item>
          )}
          <Form.Item name="projectId" label="Project" rules={[{ required: true }]}>
            <Select
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              placeholder="Select project"
              onChange={(v) => {
                setFormProjectId(v)
                form.setFieldValue('taskId', undefined)
              }}
            />
          </Form.Item>
          <Form.Item name="taskId" label="Task">
            <Select options={projectTasks.map((t) => ({ label: t.title, value: t.id }))} placeholder="Optional" allowClear />
          </Form.Item>
          <Form.Item name="date" label="Date" initialValue={dayjs()} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hours" label="Hours" rules={[{ required: true }]}>
            <InputNumber min={0.5} max={24} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Remind user to log time"
        open={remindOpen}
        onCancel={() => setRemindOpen(false)}
        onOk={() => remindForm.submit()}
        width={520}
      >
        <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          Sends an in-app notification to the chosen user. It stays unread in their bell until they submit a timesheet
          entry for the same project and task (or they mark it read).
        </p>
        <Form form={remindForm} layout="vertical" onFinish={submitReminder}>
          <Form.Item name="targetUserId" label="User to remind" rules={[{ required: true }]}>
            <Select
              placeholder="Select user"
              options={companyUsers.map((u) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
            />
          </Form.Item>
          <Form.Item name="projectId" label="Project" rules={[{ required: true }]}>
            <Select
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              onChange={(v) => {
                setRemindProjectId(v)
                remindForm.setFieldValue('taskId', undefined)
              }}
            />
          </Form.Item>
          <Form.Item name="taskId" label="Task" rules={[{ required: true }]}>
            <Select options={remindTasks.map((t) => ({ label: t.title, value: t.id }))} placeholder="Select task" />
          </Form.Item>
          <Form.Item name="title" label="Title (optional)">
            <Input placeholder="Log your time" />
          </Form.Item>
          <Form.Item name="message" label="Message (optional)">
            <Input.TextArea rows={2} placeholder="Custom message" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
