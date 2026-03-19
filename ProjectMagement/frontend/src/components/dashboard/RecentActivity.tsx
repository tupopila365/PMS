import { useQuery } from '@tanstack/react-query'
import { List, Card } from 'antd'
import { DollarOutlined, PlusOutlined, SwapOutlined, FileOutlined } from '@ant-design/icons'
import { auditService } from '../../services/auditService'
import type { AuditLog, AuditAction } from '../../types'

const actionLabels: Record<AuditAction, string> = {
  budget_updated: 'Budget item updated',
  task_created: 'New task created',
  workflow_changed: 'Workflow step status changed',
  document_uploaded: 'Document uploaded',
  cost_entry: 'Cost entry added',
}

const actionIcons: Record<AuditAction, React.ReactNode> = {
  budget_updated: <DollarOutlined />,
  task_created: <PlusOutlined />,
  workflow_changed: <SwapOutlined />,
  document_uploaded: <FileOutlined />,
  cost_entry: <DollarOutlined />,
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

export function RecentActivity() {
  const { data: logs } = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => auditService.getRecentActivity(5),
  })

  return (
    <Card title="Recent Activity">
      <List
        dataSource={logs || []}
        renderItem={(item: AuditLog) => (
          <List.Item>
            <List.Item.Meta
              avatar={actionIcons[item.action]}
              title={`${actionLabels[item.action]} on ${item.projectName}`}
              description={`${item.userName} — ${formatTimeAgo(item.timestamp)}`}
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
