import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Table, Select, Card, Button, message } from 'antd'
import { PlusOutlined, FileOutlined } from '@ant-design/icons'
import { documentService } from '../../services/documentService'
import { projectService } from '../../services/projectService'
import { useProjectContext } from '../../context/ProjectContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import type { Document } from '../../types'

export function Documents() {
  const queryClient = useQueryClient()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  const [taskFilter, setTaskFilter] = useState<string | undefined>()
  const { can } = usePermissions()

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', projectFilter, taskFilter],
    queryFn: () => documentService.getDocuments(projectFilter, taskFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const handleUpload = () => {
    message.info('Upload simulated (mock data). In production, use file picker.')
    documentService.uploadDocument({
      projectId: projectFilter || projects[0]?.id || '1',
      taskId: taskFilter,
      name: 'New Document.pdf',
      type: 'application/pdf',
      uploadedBy: '1',
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      message.success('Document added')
    })
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Project and task documents."
        actions={
          can('documents:upload') ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleUpload}>
              Upload
            </Button>
          ) : undefined
        }
      />

      <Card styles={{ body: { padding: 16 } }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="Project"
            allowClear
            style={{ width: 220 }}
            value={projectFilter}
            onChange={(v) => { setProjectFilter(v); setSelectedProjectId(v); setTaskFilter(undefined); }}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Select
            placeholder="Task"
            allowClear
            style={{ width: 200 }}
            value={taskFilter}
            onChange={setTaskFilter}
            options={[
              { label: 'Site Survey', value: '1' },
              { label: 'Foundation Work', value: '2' },
              { label: 'Paving', value: '3' },
              { label: 'Structural Design', value: '4' },
            ]}
          />
        </div>
        <Table<Document>
          dataSource={documents}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string) => <><FileOutlined style={{ marginRight: 8 }} />{n}</> },
            { title: 'Type', dataIndex: 'type', key: 'type', width: 140, render: (t: string) => t?.split('/').pop() || '-' },
            { title: 'Version', dataIndex: 'version', key: 'version', width: 80 },
            { title: 'Project', dataIndex: 'projectId', key: 'projectId', width: 120, render: (id: string) => projects.find((p) => p.id === id)?.name || id },
            { title: 'Task', dataIndex: 'taskId', key: 'taskId', width: 120 },
            { title: 'Uploaded', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 110, render: (v: string) => v?.slice(0, 10) },
          ]}
        />
      </Card>
    </div>
  )
}
