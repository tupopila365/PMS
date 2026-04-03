import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Typography, Alert } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { variationOrderService } from '../../services/projectComplianceService'
import type { VariationOrder } from '../../types'

const statusOpts = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pm_approved', label: 'PM approved' },
  { value: 'finance_approved', label: 'Finance approved' },
  { value: 'approved', label: 'Approved (final)' },
  { value: 'rejected', label: 'Rejected' },
]

function parseWorkflowError(e: unknown): string | null {
  if (e && typeof e === 'object' && 'response' in e) {
    const r = (e as { response?: { status?: number; data?: unknown } }).response
    if (r?.status === 403) {
      const d = r.data
      if (d && typeof d === 'object') {
        const o = d as { message?: string; detail?: string }
        if (typeof o.message === 'string' && o.message) return o.message
        if (typeof o.detail === 'string' && o.detail) return o.detail
      }
      return 'That status change is not allowed for your role.'
    }
  }
  return null
}

export function VariationOrdersTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['variation-orders', projectId],
    queryFn: () => variationOrderService.list(projectId),
  })

  const createMut = useMutation({
    mutationFn: (values: Partial<VariationOrder>) => variationOrderService.create(projectId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variation-orders', projectId] })
      message.success('Variation order recorded')
      setOpen(false)
      form.resetFields()
    },
    onError: () => message.error('Could not save'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<VariationOrder> }) =>
      variationOrderService.update(projectId, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['variation-orders', projectId] }),
    onError: (e) => {
      const w = parseWorkflowError(e)
      message.error(w || 'Could not update')
    },
  })

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="mb-4 rounded-lg border border-[var(--border-muted)]"
        message="Approval chain"
        description={
          <Typography.Paragraph className="!mb-0 text-xs text-[var(--text-secondary)]">
            <strong>Draft</strong> → <strong>Submitted</strong> (notifies PMs) → <strong>PM approved</strong> (PM/admin) →{' '}
            <strong>Finance approved</strong> (accountant/admin) → <strong>Approved</strong> (final PM/admin). PMs may still
            use <strong>Submitted → Approved</strong> for a one-step legacy approval. Optional ERP webhook fires when the
            record reaches <strong>Approved (final)</strong> if <Typography.Text code>app.erp.webhook-url</Typography.Text> is
            configured on the server.
          </Typography.Paragraph>
        }
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <p className="text-sm text-[var(--text-secondary)] m-0 max-w-xl">
          Track scope changes. The server enforces who may move each status. Store an external system reference in{' '}
          <strong>ERP ref</strong> when the VO is registered in finance / ERP.
        </p>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setOpen(true)} className="shrink-0 self-start">
          New variation
        </Button>
      </div>
      <Table<VariationOrder>
        size="small"
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        dataSource={rows}
        scroll={{ x: 960 }}
        columns={[
          { title: 'Ref', dataIndex: 'reference', key: 'reference', width: 100, ellipsis: true },
          { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 168,
            render: (s: string, r) => (
              <Select
                value={s || 'draft'}
                options={statusOpts}
                className="w-full min-w-[150px]"
                onChange={(v) => updateMut.mutate({ id: r.id, patch: { status: v } })}
              />
            ),
          },
          {
            title: 'Est. value',
            dataIndex: 'valueEstimate',
            key: 'valueEstimate',
            width: 120,
            render: (v: number | undefined) => (v != null ? `$${Number(v).toLocaleString()}` : '—'),
          },
          {
            title: 'ERP ref',
            key: 'erpReference',
            width: 160,
            render: (_: unknown, r) => (
              <Input
                size="small"
                defaultValue={r.erpReference}
                placeholder="External ID"
                onBlur={(ev) => {
                  const v = ev.target.value.trim()
                  if (v !== (r.erpReference || '').trim()) {
                    updateMut.mutate({ id: r.id, patch: { erpReference: v || undefined } })
                  }
                }}
              />
            ),
          },
        ]}
      />

      <Modal title="New variation order" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) =>
            createMut.mutate({
              reference: v.reference?.trim(),
              title: v.title.trim(),
              description: v.description?.trim(),
              status: v.status || 'draft',
              valueEstimate: v.valueEstimate,
              requestedAt: new Date().toISOString(),
            })
          }
        >
          <Form.Item name="reference" label="Reference / VO no.">
            <Input placeholder="e.g. VO-004" />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Short description of the change" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Scope, reason, programme impact…" />
          </Form.Item>
          <Form.Item name="status" label="Initial status" initialValue="draft">
            <Select
              options={[
                { value: 'draft', label: 'Draft (no notifications until submitted)' },
                { value: 'submitted', label: 'Submitted (notify PMs immediately)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="valueEstimate" label="Estimated value ($)">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
