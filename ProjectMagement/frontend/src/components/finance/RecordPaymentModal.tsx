import { Modal, Form, Select, InputNumber, Button } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService } from '../../services/financeService'
import type { Invoice } from '../../types'

interface RecordPaymentModalProps {
  open: boolean
  onClose: () => void
  invoices: Invoice[]
}

export function RecordPaymentModal({ open, onClose, invoices }: RecordPaymentModalProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const pendingInvoices = invoices.filter((i) => i.status === 'pending')

  const createMutation = useMutation({
    mutationFn: financeService.recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'invoices'] })
      form.resetFields()
      onClose()
    },
  })

  const onFinish = (values: { invoiceId: string; amountPaid: number }) => {
    createMutation.mutate({
      invoiceId: values.invoiceId,
      amountPaid: values.amountPaid,
      paidAt: new Date().toISOString(),
    })
  }

  return (
    <Modal
      title="Record Payment"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnClose
      className="[&_.ant-modal-content]:rounded-xl"
    >
      {pendingInvoices.length === 0 ? (
        <p className="text-[var(--text-secondary)] py-4">No pending invoices to record payment for.</p>
      ) : (
        <Form form={form} onFinish={onFinish} layout="vertical" className="[&_.ant-form-item]:mb-4">
          <Form.Item name="invoiceId" label="Invoice" rules={[{ required: true, message: 'Please select an invoice' }]}>
            <Select
              placeholder="Select invoice"
              options={pendingInvoices.map((i) => ({ value: i.id, label: `$${i.amount.toLocaleString()} (pending)` }))}
              size="large"
            />
          </Form.Item>
          <Form.Item name="amountPaid" label="Amount Paid ($)" rules={[{ required: true, message: 'Please enter the amount paid' }]}>
            <InputNumber min={1} className="w-full" placeholder="Enter amount" size="large" />
          </Form.Item>
          <Form.Item className="mb-0 mt-6">
            <div className="flex gap-2 justify-end">
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Record Payment</Button>
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
