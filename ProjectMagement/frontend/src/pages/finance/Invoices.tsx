import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, Tag, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { financeService } from '../../services/financeService'
import { projectService } from '../../services/projectService'
import { CreateInvoiceModal } from '../../components/finance/CreateInvoiceModal'

export function Invoices() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: financeService.getInvoices,
  })
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const projectMap = Object.fromEntries(projects?.map((p) => [p.id, p.name]) || [])

  const columns = [
    { title: 'Project', dataIndex: 'projectId', key: 'projectId', render: (id: string) => projectMap[id] || id },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `$${v.toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'paid' ? 'green' : 'orange'}>{s}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Invoices</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Invoice</Button>
      </div>
      <Table columns={columns} dataSource={invoices || []} rowKey="id" loading={isLoading} />
      <CreateInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
