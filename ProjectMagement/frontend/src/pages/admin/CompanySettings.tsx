import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Input, Button, message } from 'antd'
import { PageHeader } from '../../components/layout/PageHeader'
import { companyService } from '../../services/companyService'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../../components/ui/PageLoader'
import { PRODUCT_NAME } from '../../constants/branding'

export function CompanySettings() {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const companyId = user?.companyId || '1'

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId,
  })

  useEffect(() => {
    if (company) form.setFieldsValue({ name: company.name })
  }, [company, form])

  const saveMutation = useMutation({
    mutationFn: (name: string) => companyService.updateCompany(companyId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      message.success('Company settings saved')
    },
    onError: () => message.error('Could not save company'),
  })

  const onFinish = (values: { name: string }) => {
    saveMutation.mutate(values.name.trim())
  }

  if (isLoading && !company) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader
        title="Company Settings"
        subtitle={`Your company name is shown under ${PRODUCT_NAME} in the sidebar for everyone in your organization.`}
      />
      <Card title="Company Profile" styles={{ body: { padding: '20px 24px' } }}>
        <Form form={form} layout="vertical" size="large" style={{ maxWidth: 400 }} onFinish={onFinish}>
          <Form.Item
            label="Organization / company name"
            name="name"
            rules={[{ required: true, message: 'Enter your organization name' }]}
            extra="Use the legal or trading name your team recognizes (e.g. Acme Construction Ltd)."
          >
            <Input placeholder="e.g. Acme Construction Ltd" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
