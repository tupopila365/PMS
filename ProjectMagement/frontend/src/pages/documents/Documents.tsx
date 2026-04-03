import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Table, Select, Card, Button, message, Modal, Space } from 'antd'
import { PlusOutlined, FileOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { documentService } from '../../services/documentService'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import { useProjectContext } from '../../context/ProjectContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import type { Document } from '../../types'

function hasStoredFile(doc: Document): boolean {
  return Boolean(doc.filePath?.includes('/documents/file/'))
}

function DocumentPreviewBody({ doc, url }: { doc: Document; url: string }) {
  const t = (doc.type || '').toLowerCase()
  if (t.startsWith('image/')) {
    return <img src={url} alt={doc.name} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
  }
  if (t === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf')) {
    return <iframe title={doc.name} src={url} style={{ width: '100%', height: '70vh', border: 'none' }} />
  }
  return (
    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
      Preview is not available for this file type. Use Download to open it on your device.
    </p>
  )
}

export function Documents() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [projectFilter, setProjectFilter] = useState<string | undefined>(selectedProjectId)
  const [taskFilter, setTaskFilter] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const { can } = usePermissions()

  useEffect(() => {
    setProjectFilter(selectedProjectId)
  }, [selectedProjectId])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', projectFilter, taskFilter],
    queryFn: () => documentService.getDocuments(projectFilter, taskFilter),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const { data: tasksForProject = [] } = useQuery({
    queryKey: ['tasks', projectFilter],
    queryFn: () => taskService.getTasks(projectFilter),
    enabled: !!projectFilter,
  })

  const taskOptions = tasksForProject.map((t) => ({ label: t.title, value: t.id }))

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewDoc(null)
    setPreviewOpen(false)
    setPreviewLoading(false)
  }

  const openPreview = async (doc: Document) => {
    if (!hasStoredFile(doc)) {
      message.warning('This document has no stored file (metadata only).')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewDoc(doc)
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      const blob = await documentService.fetchFileBlob(doc.id, false)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      message.error('Could not load file for preview')
      closePreview()
    } finally {
      setPreviewLoading(false)
    }
  }


  const downloadDoc = async (doc: Document) => {
    if (!hasStoredFile(doc)) {
      message.warning('No file available to download.')
      return
    }
    try {
      const blob = await documentService.fetchFileBlob(doc.id, true)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Download failed')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const projectId = projectFilter || projects[0]?.id
    if (!projectId) {
      message.warning('Select a project first (or create a project).')
      return
    }

    setUploading(true)
    try {
      await documentService.uploadDocument(file, {
        projectId,
        taskId: taskFilter,
        uploadedBy: user?.id,
      })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      message.success('Document uploaded')
    } catch {
      message.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-hidden
      />
      <PageHeader
        title="Documents"
        subtitle="Project and task documents."
        actions={
          can('documents:upload') ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleUploadClick} loading={uploading}>
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
            onChange={(v) => {
              setProjectFilter(v)
              setSelectedProjectId(v)
              setTaskFilter(undefined)
            }}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Select
            placeholder="Task (optional)"
            allowClear
            style={{ width: 200 }}
            value={taskFilter}
            onChange={setTaskFilter}
            disabled={!projectFilter}
            options={taskOptions}
          />
        </div>
        <Table<Document>
          dataSource={documents}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
              render: (n: string) => (
                <>
                  <FileOutlined style={{ marginRight: 8 }} />
                  {n}
                </>
              ),
            },
            { title: 'Type', dataIndex: 'type', key: 'type', width: 140, render: (t: string) => t?.split('/').pop() || '-' },
            { title: 'Version', dataIndex: 'version', key: 'version', width: 80 },
            {
              title: 'Project',
              dataIndex: 'projectId',
              key: 'projectId',
              width: 120,
              render: (id: string) => projects.find((p) => p.id === id)?.name || id,
            },
            { title: 'Task', dataIndex: 'taskId', key: 'taskId', width: 120 },
            {
              title: 'Uploaded',
              dataIndex: 'uploadedAt',
              key: 'uploadedAt',
              width: 110,
              render: (v: string) => v?.slice(0, 10),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 200,
              render: (_: unknown, doc: Document) => {
                const fileOk = hasStoredFile(doc)
                return (
                  <Space size="small" wrap>
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      disabled={!fileOk}
                      onClick={() => openPreview(doc)}
                    >
                      Preview
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      disabled={!fileOk}
                      onClick={() => downloadDoc(doc)}
                    >
                      Download
                    </Button>
                  </Space>
                )
              },
            },
          ]}
        />
      </Card>

      <Modal
        title={previewDoc?.name || 'Preview'}
        open={previewOpen}
        onCancel={closePreview}
        footer={[
          <Button key="dl" icon={<DownloadOutlined />} onClick={() => previewDoc && downloadDoc(previewDoc)}>
            Download
          </Button>,
          <Button key="close" type="primary" onClick={closePreview}>
            Close
          </Button>,
        ]}
        width="min(960px, 95vw)"
        destroyOnClose
        styles={{ body: { maxHeight: '80vh', overflow: 'auto' } }}
      >
        {previewLoading && <p style={{ margin: 0 }}>Loading…</p>}
        {previewDoc && previewUrl && !previewLoading && <DocumentPreviewBody doc={previewDoc} url={previewUrl} />}
      </Modal>
    </div>
  )
}
