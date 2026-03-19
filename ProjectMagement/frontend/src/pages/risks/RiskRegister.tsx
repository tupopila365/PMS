import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Select, Card, Row, Col, Modal, Form, Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { riskService } from '../../services/riskService'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import { projectService } from '../../services/projectService'
import { RiskMatrix } from '../../components/risks/RiskMatrix'
import { useProjectContext } from '../../context/ProjectContext'
import type { Risk } from '../../types'

export function RiskRegister() {
  const [searchParams] = useSearchParams()
  const projectFromUrl = searchParams.get('project') || undefined
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(projectFromUrl || selectedProjectId)
  useEffect(() => {
    const v = projectFromUrl || selectedProjectId
    setProjectFilter(v)
    if (v) setSelectedProjectId(v)
  }, [projectFromUrl, selectedProjectId, setSelectedProjectId])
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const { can } = usePermissions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', projectFilter],
    queryFn: () => riskService.getRisks(projectFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const createMutation = useMutation({
    mutationFn: (values: Omit<Risk, 'id'>) => riskService.createRisk(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      setModalOpen(false)
      form.resetFields()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Risk> }) => riskService.updateRisk(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      setEditingRisk(null)
      form.resetFields()
    },
  })

  const filteredRisks = risks.filter((r) => !statusFilter || r.status === statusFilter)

  const handleSubmit = (values: Record<string, unknown>) => {
    if (editingRisk) {
      updateMutation.mutate({ id: editingRisk.id, updates: values as Partial<Risk> })
    } else {
      createMutation.mutate({
        projectId: (values.projectId as string) || projectFilter || projects[0]?.id,
        description: values.description as string,
        probability: values.probability as Risk['probability'],
        impact: values.impact as Risk['impact'],
        severity: values.severity as Risk['severity'],
        owner: values.owner as string,
        mitigation: values.mitigation as string,
        status: (values.status as Risk['status']) || 'open',
      })
    }
  }

  const openAdd = () => {
    setEditingRisk(null)
    form.setFieldsValue({ projectId: projectFilter, status: 'open' })
    setModalOpen(true)
  }

  const openEdit = (risk: Risk) => {
    setEditingRisk(risk)
    form.setFieldsValue(risk)
    setModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Risk Register"
        subtitle="Track and manage project risks."
        actions={
          can('risks:create') ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add Risk
            </Button>
          ) : undefined
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card className="rounded-xl border-[var(--border)] shadow-sm overflow-hidden" styles={{ body: { padding: 20 } }}>
            <div className="flex flex-wrap gap-3 mb-4">
              <Select
                placeholder="Project"
                allowClear
                className="w-[200px]"
                value={projectFilter}
                onChange={(v) => { setProjectFilter(v); setSelectedProjectId(v); }}
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
              />
              <Select
                placeholder="Status"
                allowClear
                className="w-[140px]"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: 'Open', value: 'open' },
                  { label: 'Mitigating', value: 'mitigating' },
                  { label: 'Closed', value: 'closed' },
                ]}
              />
            </div>
            <Table
              dataSource={filteredRisks}
              rowKey="id"
              size="small"
              scroll={{ x: 600 }}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description', width: 220, ellipsis: true },
                { title: 'Prob.', dataIndex: 'probability', key: 'probability', width: 70 },
                { title: 'Impact', dataIndex: 'impact', key: 'impact', width: 70 },
                { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 100, render: (v: string) => <span className="capitalize">{v}</span> },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <span className="capitalize">{v}</span> },
                { title: '', key: 'actions', width: 80, render: (_: unknown, r: Risk) => <Button type="link" size="small" className="p-0" onClick={() => openEdit(r)}>Edit</Button> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <RiskMatrix risks={filteredRisks} onRiskClick={openEdit} />
        </Col>
      </Row>

      <Modal
        title={editingRisk ? 'Edit Risk' : 'Add Risk'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRisk(null); form.resetFields(); }}
        onOk={() => form.submit()}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingRisk && (
            <Form.Item name="projectId" label="Project" rules={[{ required: true }]}>
              <Select options={projects.map((p) => ({ label: p.name, value: p.id }))} placeholder="Select project" />
            </Form.Item>
          )}
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="probability" label="Probability (1-5)" rules={[{ required: true }]}>
            <Select options={[1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: n }))} />
          </Form.Item>
          <Form.Item name="impact" label="Impact (1-5)" rules={[{ required: true }]}>
            <Select options={[1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: n }))} />
          </Form.Item>
          <Form.Item name="severity" label="Severity">
            <Select options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' },
            ]} />
          </Form.Item>
          <Form.Item name="owner" label="Owner">
            <Input />
          </Form.Item>
          <Form.Item name="mitigation" label="Mitigation">
            <Input.TextArea rows={2} />
          </Form.Item>
          {editingRisk && (
            <Form.Item name="status" label="Status">
              <Select options={[
                { label: 'Open', value: 'open' },
                { label: 'Mitigating', value: 'mitigating' },
                { label: 'Closed', value: 'closed' },
              ]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
