import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Form, Input, Select, DatePicker, Tag, message, Typography, Alert } from 'antd'
import { PlusOutlined, CommentOutlined } from '@ant-design/icons'
import { projectRfiService } from '../../services/projectComplianceService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import type { ProjectRFI } from '../../types'

const criticalityOpts = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const statusOpts = [
  { value: 'draft', label: 'Draft (no email / in-app issue yet)' },
  { value: 'open', label: 'Open — issued' },
  { value: 'issued', label: 'Issued' },
  { value: 'answered', label: 'Answered' },
  { value: 'closed', label: 'Closed' },
]

export function ProjectRFIsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const usersCompanyId = user?.companyId
  const [open, setOpen] = useState(false)
  const [responseRow, setResponseRow] = useState<ProjectRFI | null>(null)
  const [form] = Form.useForm()
  const [respForm] = Form.useForm()

  const { data: users = [] } = useQuery({
    queryKey: ['users', usersCompanyId],
    queryFn: () => userService.getUsers(usersCompanyId),
    enabled: Boolean(usersCompanyId),
  })
  const userOptions = users.map((u) => ({ value: u.id, label: u.name }))

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['rfis', projectId],
    queryFn: () => projectRfiService.list(projectId),
  })

  const createMut = useMutation({
    mutationFn: (values: Partial<ProjectRFI>) => projectRfiService.create(projectId, values),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['rfis', projectId] })
      const st = vars.status || 'open'
      message.success(
        st === 'draft'
          ? 'RFI saved as draft'
          : 'RFI issued — tagged users are notified in-app; email sends if SMTP is configured on the server',
      )
      setOpen(false)
      form.resetFields()
    },
    onError: () => message.error('Could not save RFI'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProjectRFI> }) => projectRfiService.update(projectId, id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rfis', projectId] })
      message.success('RFI updated')
    },
    onError: () => message.error('Could not update'),
  })

  const critColor = (c?: string) => {
    if (c === 'critical') return 'red'
    if (c === 'high') return 'orange'
    if (c === 'medium') return 'gold'
    return 'default'
  }

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="mb-4 rounded-lg border border-[var(--border-muted)]"
        message="RFI workflow"
        description={
          <Typography.Paragraph className="!mb-0 text-xs text-[var(--text-secondary)]">
            Use <strong>Draft</strong> while composing; switch to <strong>Open / Issued</strong> when ready — tagged responders
            get in-app notifications and optional email (configure <Typography.Text code>spring.mail.*</Typography.Text> on the
            server). Record a formal reply with <strong>Record response</strong>, then set status to <strong>Answered</strong>{' '}
            or <strong>Closed</strong>. The raiser is notified when an RFI moves to <strong>Answered</strong>.
          </Typography.Paragraph>
        }
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <p className="text-sm text-[var(--text-secondary)] m-0 max-w-xl">
          Structured RFIs with criticality, due dates, and response text.
        </p>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          New RFI
        </Button>
      </div>
      <Table<ProjectRFI>
        size="small"
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        dataSource={rows}
        scroll={{ x: 980 }}
        columns={[
          { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
          {
            title: 'Criticality',
            dataIndex: 'criticality',
            key: 'criticality',
            width: 110,
            render: (c: string) => <Tag color={critColor(c)}>{c || '—'}</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 200,
            render: (s: string, r) => (
              <Select
                value={s || 'open'}
                options={statusOpts}
                className="w-full min-w-[180px]"
                onChange={(v) => updateMut.mutate({ id: r.id, patch: { status: v } })}
              />
            ),
          },
          {
            title: 'Due',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: 110,
            render: (d: string) => (d ? d.slice(0, 10) : '—'),
          },
          {
            title: 'Response',
            key: 'responseText',
            ellipsis: true,
            render: (_: unknown, r) => (
              <span className="text-xs text-[var(--text-muted)]">{r.responseText?.trim() ? r.responseText.slice(0, 80) : '—'}</span>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 128,
            render: (_: unknown, r) => (
              <Button
                type="link"
                size="small"
                className="px-0"
                icon={<CommentOutlined />}
                onClick={() => {
                  setResponseRow(r)
                  respForm.setFieldsValue({
                    responseText: r.responseText || '',
                    status: r.status === 'draft' ? 'open' : r.status || 'answered',
                  })
                }}
              >
                Record response
              </Button>
            ),
          },
        ]}
      />

      <Modal title="New RFI" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose width={520}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) =>
            createMut.mutate({
              subject: v.subject.trim(),
              question: v.question?.trim(),
              criticality: v.criticality || 'medium',
              status: v.status || 'open',
              responderUserIds: v.responderUserIds?.length ? v.responderUserIds : undefined,
              dueDate: v.dueDate ? v.dueDate.format('YYYY-MM-DD') : undefined,
            })
          }
        >
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="What do you need clarified?" />
          </Form.Item>
          <Form.Item name="question" label="Question / detail">
            <Input.TextArea rows={4} placeholder="Context, drawing ref, spec clause…" />
          </Form.Item>
          <Form.Item name="criticality" label="Criticality" initialValue="medium">
            <Select options={criticalityOpts} />
          </Form.Item>
          <Form.Item name="status" label="Issue status" initialValue="open">
            <Select options={statusOpts.filter((o) => o.value === 'draft' || o.value === 'open')} />
          </Form.Item>
          <Form.Item name="responderUserIds" label="Who should respond?">
            <Select mode="multiple" options={userOptions} placeholder="Tag people — notified when issued (not draft)" allowClear />
          </Form.Item>
          <Form.Item name="dueDate" label="Response due">
            <DatePicker className="w-full" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Record RFI response"
        open={responseRow != null}
        onCancel={() => {
          setResponseRow(null)
          respForm.resetFields()
        }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          form={respForm}
          layout="vertical"
          onFinish={(v) => {
            if (!responseRow) return
            updateMut.mutate(
              {
                id: responseRow.id,
                patch: {
                  responseText: v.responseText?.trim() || undefined,
                  status: v.status,
                },
              },
              {
                onSuccess: () => {
                  setResponseRow(null)
                  respForm.resetFields()
                },
              },
            )
          }}
        >
          <Typography.Paragraph type="secondary" className="text-xs">
            {responseRow?.subject}
          </Typography.Paragraph>
          <Form.Item name="responseText" label="Response / answer">
            <Input.TextArea rows={5} placeholder="Formal reply, drawing revision, spec clarification…" />
          </Form.Item>
          <Form.Item name="status" label="Status after saving" rules={[{ required: true }]}>
            <Select options={statusOpts.filter((o) => o.value !== 'draft')} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setResponseRow(null)
                respForm.resetFields()
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={updateMut.isPending}>
              Save response
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
