import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Select, Card, Button, Space, Modal, Form, Input, Spin, Alert, message } from 'antd'
import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { changeService } from '../../services/changeService'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import { useProjectContext } from '../../context/ProjectContext'
import type { ChangeRequest } from '../../types'

export function ChangeLog() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const { user } = useAuth()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)

  useEffect(() => {
    setProjectFilter(selectedProjectId)
  }, [selectedProjectId])
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const {
    data: changes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['changes', projectFilter],
    queryFn: () => changeService.getChanges(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const filtered = changes.filter((c) => !statusFilter || c.status === statusFilter)

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      changeService.updateChange(id, {
        status: 'approved',
        approvalStep: 'approved',
        reviewedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] })
      message.success('Change approved')
    },
    onError: () => message.error('Could not approve change'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      changeService.updateChange(id, {
        status: 'rejected',
        approvalStep: 'rejected',
        reviewedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] })
      message.success('Change rejected')
    },
    onError: () => message.error('Could not reject change'),
  })

  const createMutation = useMutation({
    mutationFn: changeService.createChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] })
      message.success('Change request submitted')
      setModalOpen(false)
      form.resetFields()
    },
    onError: () => message.error('Could not submit change request'),
  })

  const submitRequest = () => {
    form.validateFields().then((values) => {
      const requester = user?.name?.trim() || user?.email?.trim() || 'Unknown'
      createMutation.mutate({
        projectId: values.projectId,
        title: values.title.trim(),
        reason: values.reason.trim(),
        requester,
        requesterUserId: user?.id,
        requestedAt: new Date().toISOString(),
        impactScope: values.impactScope?.trim() || undefined,
        impactSchedule: values.impactSchedule?.trim() || undefined,
        impactBudget: values.impactBudget?.trim() || undefined,
        status: 'pending',
        approvalStep: 'submitted',
      })
    })
  }

  return (
    <div>
      <PageHeader title="Change Log" subtitle="Track requested and implemented changes." />

      {isError && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message="Could not load change requests"
          description={error instanceof Error ? error.message : 'Check your connection and try again.'}
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      <Card className="overflow-hidden" styles={{ body: { padding: 16 } }}>
        <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              placeholder="All projects"
              allowClear
              className="min-w-[200px]"
              value={projectFilter}
              onChange={(v) => {
                setProjectFilter(v)
                setSelectedProjectId(v)
              }}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
            />
            <Select
              placeholder="Status"
              allowClear
              className="w-[140px]"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Under review', value: 'under_review' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
            <span className="text-xs text-[var(--text-muted)] max-w-md">
              Matches the header project filter when set. Clear to show changes across all projects.
            </span>
          </div>
          {can('changes:view') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New change request
            </Button>
          )}
        </div>

        <Spin spinning={isLoading}>
          <Table<ChangeRequest>
            dataSource={filtered}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: isLoading
                ? 'Loading…'
                : projectFilter
                  ? 'No change requests for this project. Try clearing the project filter or submit a new request.'
                  : 'No change requests yet. Use “New change request” to add one.',
            }}
            columns={[
              { title: 'Title', dataIndex: 'title', key: 'title', width: 180, ellipsis: true },
              { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 120, ellipsis: true },
              { title: 'Requester', dataIndex: 'requester', key: 'requester', width: 120 },
              { title: 'Requested', dataIndex: 'requestedAt', key: 'requestedAt', width: 110, render: (v: string) => v?.slice(0, 10) },
              { title: 'Impact Scope', dataIndex: 'impactScope', key: 'impactScope', width: 100 },
              { title: 'Impact Schedule', dataIndex: 'impactSchedule', key: 'impactSchedule', width: 120 },
              { title: 'Impact Budget', dataIndex: 'impactBudget', key: 'impactBudget', width: 110 },
              { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
              ...(can('changes:approve')
                ? [
                    {
                      title: 'Actions',
                      key: 'actions',
                      width: 180,
                      render: (_: unknown, record: ChangeRequest) =>
                        record.status === 'pending' ? (
                          <Space size="small" wrap>
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckOutlined />}
                              loading={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(record.id)}
                              style={{ minWidth: 88 }}
                            >
                              Approve
                            </Button>
                            <Button
                              danger
                              size="small"
                              icon={<CloseOutlined />}
                              loading={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(record.id)}
                              style={{ minWidth: 88 }}
                            >
                              Reject
                            </Button>
                          </Space>
                        ) : null,
                    },
                  ]
                : []),
            ]}
          />
        </Spin>
      </Card>

      <Modal
        title="New change request"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        onOk={submitRequest}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item name="projectId" label="Project" rules={[{ required: true, message: 'Select a project' }]}>
            <Select
              placeholder="Select project"
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Enter a title' }]}>
            <Input placeholder="Short summary of the change" maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Enter a reason' }]}>
            <Input.TextArea placeholder="Why is this change needed?" rows={3} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="impactScope" label="Impact — scope">
            <Input placeholder="Optional" maxLength={500} />
          </Form.Item>
          <Form.Item name="impactSchedule" label="Impact — schedule">
            <Input placeholder="Optional" maxLength={500} />
          </Form.Item>
          <Form.Item name="impactBudget" label="Impact — budget">
            <Input placeholder="Optional" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
