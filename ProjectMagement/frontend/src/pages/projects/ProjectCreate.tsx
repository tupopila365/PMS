import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, InputNumber, Select, AutoComplete, Button, Card, Alert, message } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/layout/PageHeader'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { templateService } from '../../services/templateService'
import { projectService } from '../../services/projectService'
import type { RiskLevel } from '../../types'
import { PROJECT_TYPE_PRESET_OPTIONS } from '../../utils/projectType'

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
        type: String(values.type ?? '').trim(),
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
    onError: (err: Error) => {
      message.error(err.message || 'Could not create project from template')
    },
  })

  const createPlainMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/projects/${data.id}`)
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message
          : undefined
      message.error(
        typeof msg === 'string' ? msg : 'Could not create project. Is the API running and are you logged in?'
      )
    },
  })

  const onFinish = (values: { name: string; type: string; region?: string; client?: string; riskLevel?: RiskLevel; budget?: number; templateId?: string }) => {
    const type = String(values.type ?? '').trim()
    if (useTemplate && values.templateId) {
      createFromTemplateMutation.mutate({ templateId: values.templateId, values: { ...values, type } })
    } else {
      createPlainMutation.mutate({
        name: values.name,
        type,
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
          <Form.Item
            name="type"
            label="Type"
            rules={[
              {
                validator: (_, v) => {
                  if (v == null || !String(v).trim()) return Promise.reject(new Error('Please enter a type'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <AutoComplete
              options={PROJECT_TYPE_PRESET_OPTIONS}
              placeholder="Choose a suggestion or type your own"
              disabled={useTemplate}
              allowClear
              filterOption={(inputValue, option) => {
                const v = (option?.value ?? '').toString().toLowerCase()
                const lab = (option?.label ?? '').toString().toLowerCase()
                const q = inputValue.toLowerCase()
                return v.includes(q) || lab.includes(q)
              }}
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
          <Form.Item name="budget" label="Estimated cost ($)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Estimated cost (spread across CBS when using a template)" />
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
