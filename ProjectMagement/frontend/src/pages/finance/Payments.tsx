import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { financeService } from '../../services/financeService'
import { projectService } from '../../services/projectService'
import { RecordPaymentModal } from '../../components/finance/RecordPaymentModal'
import { PageHeader } from '../../components/layout/PageHeader'

export function Payments() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: financeService.getPayments,
  })
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: financeService.getInvoices,
  })
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const invoiceMap = Object.fromEntries(invoices?.map((i) => [i.id, i]) || [])
  const projectMap = Object.fromEntries(projects?.map((p) => [p.id, p.name]) || [])

  const columns = [
    { title: 'Invoice', dataIndex: 'invoiceId', key: 'invoiceId', render: (id: string) => {
      const inv = invoiceMap[id]
      return inv ? `${projectMap[inv.projectId] || inv.projectId} - $${inv.amount.toLocaleString()}` : id
    }},
    { title: 'Amount Paid', dataIndex: 'amountPaid', key: 'amountPaid', render: (v: number) => `$${v.toLocaleString()}` },
    { title: 'Paid At', dataIndex: 'paidAt', key: 'paidAt', render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
  ]

  const pendingInvoices = invoices?.filter((i) => i.status === 'pending') || []

  return (
    <div>
      <PageHeader
        title="Payments"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Record Payment</Button>
        }
      />
      <Table columns={columns} dataSource={payments || []} rowKey="id" loading={isLoading} pagination={{ pageSize: 10, showSizeChanger: true }} />
      <RecordPaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        invoices={pendingInvoices}
      />
    </div>
  )
}
