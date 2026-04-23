import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Tooltip } from 'antd'
import { UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { getDefaultLandingPath } from '../../utils/permissions'
import type { UserRole } from '../../types'
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../../constants/branding'

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
    <main
      className="login-page-root min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="login-page-bg" aria-hidden />
      <div className="login-page-mesh" aria-hidden />
      <div className="login-page-beam" aria-hidden />
      <div className="login-page-arc" aria-hidden />
      <div className="login-page-vignette" aria-hidden />
      <div className="login-page-noise" aria-hidden />
      <div className="login-page-frame" aria-hidden />
      <Card
        className="login-page-card w-full max-w-[400px] rounded-none mx-auto relative z-10"
        styles={{
          body: { padding: 'clamp(1.25rem, 4vw, 2rem) clamp(1rem, 4vw, 2.5rem)' },
        }}
      >
        <div className="text-center mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary)] mb-3 opacity-90">
            Secure access
          </p>
          <h1 className="text-2xl sm:text-[1.65rem] font-semibold text-[var(--text-primary)] font-[var(--font-heading)] tracking-tight mb-1.5 bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
            {PRODUCT_NAME}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{PRODUCT_TAGLINE}</p>
        </div>
        <p className="text-center text-[var(--text-secondary)] text-sm mb-1">Sign in to your account</p>
        <p className="text-center text-xs text-[var(--text-muted)] mb-6 max-w-[22rem] mx-auto leading-snug">
          Your organization name appears under {PRODUCT_NAME} in the sidebar. Admins set it under Admin → Company.
        </p>
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
    </main>
  )
}
