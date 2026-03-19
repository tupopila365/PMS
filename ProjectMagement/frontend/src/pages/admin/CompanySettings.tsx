import { Card, Form, Input, Button, message } from 'antd'
import { PageHeader } from '../../components/layout/PageHeader'

export function CompanySettings() {
  const [form] = Form.useForm()

  const onFinish = () => {
    message.success('Company settings saved')
  }

  return (
    <div>
      <PageHeader title="Company Settings" />
      <Card title="Company Profile" styles={{ body: { padding: '20px 24px' } }}>
        <Form form={form} layout="vertical" size="large" style={{ maxWidth: 400 }} onFinish={onFinish}>
          <Form.Item label="Company Name" name="name" rules={[{ required: true }]} initialValue="CBMP Construction">
            <Input placeholder="Company name" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
