import { useQuery } from '@tanstack/react-query'
import { Card, Descriptions, Tag, Button, Row, Col, Progress } from 'antd'
import { CrownOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { companyService } from '../../services/companyService'
import { PageHeader } from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/PageLoader'
import { projectService } from '../../services/projectService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import type { PlanTier } from '../../types'

const PLAN_LABELS: Record<PlanTier, string> = {
  starter: 'Starter',
  standard: 'Standard',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<PlanTier, string> = {
  starter: 'default',
  standard: 'blue',
  professional: 'purple',
  enterprise: 'gold',
}

export function SubscriptionSettings() {
  const { user } = useAuth()
  const companyId = user?.companyId

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId,
  })

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', companyId],
    queryFn: () => companyService.getSubscription(companyId),
    enabled: !!companyId,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => userService.getUsers(companyId),
    enabled: !!companyId,
  })

  const isLoading = companyLoading || subLoading

  const userCount = companyUsers.length
  const projectCount = projects.filter((p) => p.companyId === companyId).length

  if (isLoading) {
    return <PageLoader />
  }

  const userPercent = subscription && subscription.maxUsers > 0
    ? Math.min(100, Math.round((userCount / subscription.maxUsers) * 100))
    : 0

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Manage your plan and usage." />

      <Card title="Current Plan" styles={{ body: { padding: '20px 24px' } }}>
        <Descriptions column={1}>
          <Descriptions.Item label="Plan">
            <Tag color={subscription ? PLAN_COLORS[subscription.plan] : 'blue'}>
              {subscription ? PLAN_LABELS[subscription.plan] : 'Standard'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={subscription?.status === 'active' ? 'green' : 'red'}>
              {subscription?.status === 'active' ? 'Active' : subscription?.status || 'Active'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Users">
            {subscription?.maxUsers === -1 ? `${userCount} (Unlimited)` : `${userCount} / ${subscription?.maxUsers}`}
          </Descriptions.Item>
          <Descriptions.Item label="Projects">
            {subscription?.maxProjects === -1 ? `${projectCount} (Unlimited)` : `${projectCount} / ${subscription?.maxProjects}`}
          </Descriptions.Item>
          <Descriptions.Item label="Storage">{subscription?.storageGB ?? 50} GB</Descriptions.Item>
          <Descriptions.Item label="Expires">
            {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : '2025-12-31'}
          </Descriptions.Item>
        </Descriptions>

        {subscription && subscription.maxUsers > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 8 }}>Usage</h4>
            <Progress percent={userPercent} status={userPercent >= 90 ? 'exception' : 'active'} />
          </div>
        )}
      </Card>

      <Card title="Available Plans" style={{ marginTop: 24 }} styles={{ body: { padding: '20px 24px' } }}>
        <Row gutter={[16, 16]}>
          {(['starter', 'standard', 'professional', 'enterprise'] as PlanTier[]).map((plan) => (
            <Col xs={24} sm={12} lg={6} key={plan}>
              <Card
                size="small"
                title={PLAN_LABELS[plan]}
                extra={subscription?.plan === plan ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
              >
                <p style={{ margin: '8px 0' }}>
                  {plan === 'starter' && '5 users, 10 projects, 10 GB'}
                  {plan === 'standard' && '10 users, Unlimited projects, 50 GB'}
                  {plan === 'professional' && '25 users, Unlimited projects, 200 GB'}
                  {plan === 'enterprise' && 'Unlimited users & projects, 1 TB'}
                </p>
                <Button
                  type={subscription?.plan === plan ? 'default' : 'primary'}
                  block
                  disabled={subscription?.plan === plan}
                  icon={plan === 'enterprise' ? <CrownOutlined /> : undefined}
                >
                  {subscription?.plan === plan ? 'Current Plan' : 'Upgrade'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
