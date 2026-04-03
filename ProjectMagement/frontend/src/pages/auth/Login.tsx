import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Tooltip } from 'antd'
import { UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { getDefaultLandingPath } from '../../utils/permissions'
import type { UserRole } from '../../types'

export function Login() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const user = await login(values.email, values.password)
      message.success('Login successful')
      navigate(getDefaultLandingPath(user.role as UserRole))
    } catch {
      message.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[var(--page-bg)] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--surface-muted)_0%,var(--page-bg)_100%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.15),transparent)] -z-10" />
      <Card
        className="w-full max-w-[400px] rounded-2xl border border-[var(--border)] shadow-xl mx-auto"
        styles={{
          body: { padding: 'clamp(1.25rem, 4vw, 2rem) clamp(1rem, 4vw, 2.5rem)' },
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-heading)] tracking-tight mb-1">
            CBMP
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Construction Business Management Platform</p>
        </div>
        <p className="text-center text-[var(--text-secondary)] mb-6">Sign in to your account</p>
        <Form name="login" onFinish={onFinish} layout="vertical" size="large" className="[&_.ant-form-item]:mb-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<UserOutlined className="text-[var(--text-muted)]" />} placeholder="you@company.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password prefix={<LockOutlined className="text-[var(--text-muted)]" />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item className="mb-0 mt-6">
            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="h-11 font-medium">
              Sign In
            </Button>
          </Form.Item>
        </Form>
        <div className="mt-6 pt-4 border-t border-[var(--border-muted)] flex items-center justify-center gap-1.5">
          <span className="text-xs text-[var(--text-muted)]">Demo credentials</span>
          <Tooltip title="admin@cbmp.com, pm@cbmp.com, contractor@cbmp.com / password">
            <InfoCircleOutlined className="text-[var(--text-muted)] text-xs cursor-help" />
          </Tooltip>
        </div>
      </Card>
    </div>
  )
}
