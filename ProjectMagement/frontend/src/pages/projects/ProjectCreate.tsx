import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, InputNumber, Select, Button, Card, Alert } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/layout/PageHeader'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { templateService } from '../../services/templateService'
import { projectService } from '../../services/projectService'
import type { ProjectType, RiskLevel } from '../../types'

const typeOptions: { value: ProjectType; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'roads', label: 'Roads' },
  { value: 'railway', label: 'Railway' },
  { value: 'buildings', label: 'Buildings' },
]

const riskOptions: { value: RiskLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function ProjectCreate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [useTemplate, setUseTemplate] = useState(false)

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates(),
  })

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, values }: { templateId: string; values: Record<string, unknown> }) =>
      templateService.createProjectFromTemplate(templateId, {
        name: values.name as string,
        type: values.type as ProjectType,
        companyId: '1',
        region: values.region as string,
        client: values.client as string,
        riskLevel: values.riskLevel as RiskLevel,
        budget: values.budget as number,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['cost-categories'] })
      navigate(`/projects/${data.id}`)
    },
  })

  const createPlainMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/projects/${data.id}`)
    },
  })

  const onFinish = (values: { name: string; type: ProjectType; region?: string; client?: string; riskLevel?: RiskLevel; budget?: number; templateId?: string }) => {
    if (useTemplate && values.templateId) {
      createFromTemplateMutation.mutate({ templateId: values.templateId, values })
    } else {
      createPlainMutation.mutate({
        name: values.name,
        type: values.type,
        companyId: '1',
        region: values.region,
        client: values.client,
        riskLevel: values.riskLevel,
        budget: values.budget,
      })
    }
  }

  const isPending = createFromTemplateMutation.isPending || createPlainMutation.isPending

  const templateOptions = templates
    .filter((t) => !form.getFieldValue('type') || t.projectType === form.getFieldValue('type'))
    .map((t) => ({ value: t.id, label: `${t.name} (${t.wbsTasks.length} tasks, ${t.cbsCategories.length} cost categories)` }))

  return (
    <div>
      <PageHeader
        title="Create Project"
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
            Back
          </Button>
        }
      />
      <Card title="Project Details" styles={{ body: { padding: '20px 24px' } }}>
        <Form form={form} layout="vertical" size="large" onFinish={onFinish} style={{ maxWidth: 500 }}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
            <Input placeholder="Enter project name" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={typeOptions}
              placeholder="Select type"
              disabled={useTemplate}
              onChange={() => useTemplate && form.setFieldValue('templateId', undefined)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type={useTemplate ? 'primary' : 'default'}
              icon={<FileTextOutlined />}
              onClick={() => setUseTemplate(!useTemplate)}
              style={{ marginBottom: 8 }}
            >
              {useTemplate ? 'Using template' : 'Create from template'}
            </Button>
          </Form.Item>

          {useTemplate && (
            <>
              <Form.Item name="templateId" label="Template" rules={useTemplate ? [{ required: true, message: 'Select a template' }] : []}>
                <Select
                  placeholder="Select WBS/CBS template"
                  options={templateOptions}
                  onChange={(templateId) => {
                    const t = templates.find((x) => x.id === templateId)
                    if (t) form.setFieldValue('type', t.projectType)
                  }}
                />
              </Form.Item>
              {templateOptions.length === 0 && form.getFieldValue('type') && (
                <Alert type="info" message="No templates for this type. Select a different type or create without template." style={{ marginBottom: 16 }} />
              )}
            </>
          )}

          <Form.Item name="region" label="Region">
            <Input placeholder="e.g. North, Central" />
          </Form.Item>
          <Form.Item name="client" label="Client">
            <Input placeholder="Client name" />
          </Form.Item>
          <Form.Item name="riskLevel" label="Risk Level">
            <Select options={riskOptions} placeholder="Select risk level" allowClear />
          </Form.Item>
          <Form.Item name="budget" label="Budget ($)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter budget (allocated to cost categories when using template)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isPending}>
              Create Project
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
