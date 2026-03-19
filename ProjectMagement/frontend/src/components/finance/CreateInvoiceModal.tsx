import { Modal, Form, InputNumber, Button, Select } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financeService } from '../../services/financeService'
import { projectService } from '../../services/projectService'

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  projectId?: string
}

export function CreateInvoiceModal({ open, onClose, projectId: initialProjectId }: CreateInvoiceModalProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: financeService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      form.resetFields()
      onClose()
    },
  })

  const onFinish = (values: { amount: number; projectId?: string }) => {
    const pid = initialProjectId || values.projectId
    if (!pid) return
    createMutation.mutate({
      projectId: pid,
      amount: values.amount,
      status: 'pending',
    })
  }

  return (
    <Modal
      title="New Invoice"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      className="[&_.ant-modal-content]:rounded-xl"
    >
      <Form form={form} onFinish={onFinish} layout="vertical" initialValues={initialProjectId ? {} : undefined} className="[&_.ant-form-item]:mb-4">
        {!initialProjectId && (
          <Form.Item name="projectId" label="Project" rules={[{ required: true, message: 'Please select a project' }]}>
            <Select placeholder="Select project" options={projects?.map((p) => ({ value: p.id, label: p.name }))} size="large" />
          </Form.Item>
        )}
        <Form.Item name="amount" label="Amount ($)" rules={[{ required: true, message: 'Please enter an amount' }]}>
          <InputNumber min={1} className="w-full" placeholder="Enter amount" size="large" />
        </Form.Item>
        <Form.Item className="mb-0 mt-6">
          <div className="flex gap-2 justify-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Create Invoice</Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
