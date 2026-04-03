import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Upload, Button, Typography, message } from 'antd'
import { UploadOutlined, DiffOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { boqService } from '../../services/projectComplianceService'
import type { BoqLine } from '../../types'

export function ProjectBOQTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [uploading, setUploading] = useState(false)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['boq', projectId],
    queryFn: () => boqService.list(projectId),
  })

  const importMut = useMutation({
    mutationFn: (file: File) => boqService.importCsv(projectId, file),
    onSuccess: (r) => {
      message.success(`Imported ${r.imported} BOQ lines (replaced previous import for this project)`)
      qc.invalidateQueries({ queryKey: ['boq', projectId] })
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || '')
        : ''
      message.error(msg || 'Import failed — check CSV format')
    },
    onSettled: () => setUploading(false),
  })

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="max-w-2xl">
          <Typography.Paragraph type="secondary" className="text-sm !mb-2">
            Import a bill of quantities from CSV. Expected header row with columns such as{' '}
            <Typography.Text code>itemCode</Typography.Text>, <Typography.Text code>description</Typography.Text>,{' '}
            <Typography.Text code>unit</Typography.Text>, <Typography.Text code>quantity</Typography.Text>,{' '}
            <Typography.Text code>rate</Typography.Text>, <Typography.Text code>amount</Typography.Text>,{' '}
            <Typography.Text code>section</Typography.Text> (aliases like <Typography.Text code>qty</Typography.Text>,{' '}
            <Typography.Text code>code</Typography.Text> are accepted). Each import replaces existing BOQ lines for this
            project.
          </Typography.Paragraph>
          <Upload
            accept=".csv,text/csv"
            maxCount={1}
            showUploadList
            beforeUpload={(file) => {
              setUploading(true)
              importMut.mutate(file)
              return false
            }}
            disabled={uploading || importMut.isPending}
          >
            <Button icon={<UploadOutlined />} loading={uploading || importMut.isPending}>
              Import CSV
            </Button>
          </Upload>
        </div>
        {can('portfolio:view') && (
          <Button type="default" icon={<DiffOutlined />} onClick={() => navigate('/portfolio/boq-compare')} className="shrink-0">
            Cross-project BOQ compare
          </Button>
        )}
      </div>

      <Table<BoqLine>
        size="small"
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 12, showSizeChanger: true }}
        dataSource={rows}
        scroll={{ x: 900 }}
        columns={[
          { title: 'Code', dataIndex: 'itemCode', key: 'itemCode', width: 120, ellipsis: true },
          { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
          { title: 'Section', dataIndex: 'section', key: 'section', width: 120, ellipsis: true },
          { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 72 },
          {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 88,
            align: 'right',
            render: (q: number | undefined) => (q != null ? Number(q).toLocaleString() : '—'),
          },
          {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            width: 100,
            align: 'right',
            render: (r: number | undefined) => (r != null ? `$${Number(r).toLocaleString()}` : '—'),
          },
          {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 110,
            align: 'right',
            render: (a: number | undefined) => (a != null ? `$${Number(a).toLocaleString()}` : '—'),
          },
        ]}
      />
    </div>
  )
}
