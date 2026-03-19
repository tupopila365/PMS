import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Select, Card, Button, Space } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { changeService } from '../../services/changeService'
import { projectService } from '../../services/projectService'
import { useProjectContext } from '../../context/ProjectContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import type { ChangeRequest } from '../../types'

export function ChangeLog() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  useEffect(() => { setProjectFilter(selectedProjectId) }, [selectedProjectId])
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  const { data: changes = [] } = useQuery({
    queryKey: ['changes', projectFilter],
    queryFn: () => changeService.getChanges(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const filtered = changes.filter((c) => !statusFilter || c.status === statusFilter)

  const approveMutation = useMutation({
    mutationFn: (id: string) => changeService.updateChange(id, { status: 'approved', approvalStep: 'approved', reviewedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['changes'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => changeService.updateChange(id, { status: 'rejected', approvalStep: 'rejected', reviewedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['changes'] }),
  })

  return (
    <div>
      <PageHeader title="Change Log" subtitle="Track requested and implemented changes." />

      <Card className="overflow-hidden" styles={{ body: { padding: 16 } }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="Project"
            allowClear
            style={{ width: 200 }}
            value={projectFilter}
            onChange={(v) => { setProjectFilter(v); setSelectedProjectId(v); }}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
            ]}
          />
        </div>
        <Table<ChangeRequest>
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
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
              ? [{
                  title: 'Actions',
                  key: 'actions',
                  width: 180,
                  render: (_: unknown, record: ChangeRequest) =>
                    record.status === 'pending' ? (
                      <Space size="small" wrap>
                        <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => approveMutation.mutate(record.id)} style={{ minWidth: 88 }}>Approve</Button>
                        <Button danger size="small" icon={<CloseOutlined />} onClick={() => rejectMutation.mutate(record.id)} style={{ minWidth: 88 }}>Reject</Button>
                      </Space>
                    ) : null,
                }]
              : []),
          ]}
        />
      </Card>
    </div>
  )
}
