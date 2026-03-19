import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Select, Card, Modal, Form, InputNumber, DatePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { timesheetService } from '../../services/timesheetService'
import { PageHeader } from '../../components/layout/PageHeader'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import { useProjectContext } from '../../context/ProjectContext'
import type { TimesheetEntry } from '../../types'
import dayjs from 'dayjs'

export function Timesheets() {
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  useEffect(() => { setProjectFilter(selectedProjectId) }, [selectedProjectId])
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
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

  const createMutation = useMutation({
    mutationFn: (values: Omit<TimesheetEntry, 'id'>) => timesheetService.createEntry(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      setModalOpen(false)
      form.resetFields()
    },
  })

  const handleSubmit = (values: Record<string, unknown>) => {
    createMutation.mutate({
      projectId: values.projectId as string,
      taskId: values.taskId as string | undefined,
      userId: '1',
      hours: values.hours as number,
      date: (values.date as dayjs.Dayjs)?.format('YYYY-MM-DD') || new Date().toISOString().slice(0, 10),
      description: values.description as string,
    })
  }

  const [formProjectId, setFormProjectId] = useState<string | undefined>()
  const projectTasks = (formProjectId ? tasks.filter((t) => t.projectId === formProjectId) : tasks)

  return (
    <div>
      <PageHeader
        title="Timesheets"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Add Entry
          </Button>
        }
      />

      <Card styles={{ body: { padding: 16 } }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Select
            placeholder="Project"
            allowClear
            style={{ width: 200 }}
            value={projectFilter}
            onChange={(v) => { setProjectFilter(v); setSelectedProjectId(v); }}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
        </div>
        <Table<TimesheetEntry>
          dataSource={entries}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
            { title: 'Project', dataIndex: 'projectId', key: 'projectId', render: (id) => projects.find((p) => p.id === id)?.name || id },
            { title: 'Task', dataIndex: 'taskId', key: 'taskId', render: (id) => tasks.find((t) => t.id === id)?.title || '-' },
            { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 80 },
            { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
          ]}
        />
      </Card>

      <Modal title="Add Time Entry" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={520}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="projectId" label="Project" rules={[{ required: true }]}>
            <Select options={projects.map((p) => ({ label: p.name, value: p.id }))} placeholder="Select project" onChange={(v) => { setFormProjectId(v); form.setFieldValue('taskId', undefined); }} />
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
    </div>
  )
}
