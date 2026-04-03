import { useQuery } from '@tanstack/react-query'
import { List, Card } from 'antd'
import { DollarOutlined, PlusOutlined, SwapOutlined, FileOutlined, WarningOutlined, FolderOutlined } from '@ant-design/icons'
import { dashboardService } from '../../services/dashboardService'
import { useProjectContext } from '../../context/ProjectContext'
import type { AuditLog, AuditAction } from '../../types'

const actionLabels: Record<AuditAction, string> = {
  budget_updated: 'Cost estimate updated',
  task_created: 'New task created',
  project_created: 'New project created',
  task_updated: 'Task updated',
  workflow_changed: 'Workflow step status changed',
  document_uploaded: 'Document uploaded',
  cost_entry: 'Cost entry added',
  risk_created: 'Risk logged',
  risk_updated: 'Risk updated',
  change_requested: 'Change requested',
  change_approved: 'Change approved',
  change_rejected: 'Change rejected',
  timesheet_entry: 'Timesheet entry',
  invoice_created: 'Invoice created',
  payment_recorded: 'Payment recorded',
}

const actionIcons: Partial<Record<AuditAction, React.ReactNode>> = {
  budget_updated: <DollarOutlined />,
  task_created: <PlusOutlined />,
  project_created: <FolderOutlined />,
  task_updated: <PlusOutlined />,
  workflow_changed: <SwapOutlined />,
  document_uploaded: <FileOutlined />,
  cost_entry: <DollarOutlined />,
  risk_created: <WarningOutlined />,
  risk_updated: <WarningOutlined />,
  change_requested: <SwapOutlined />,
  change_approved: <SwapOutlined />,
  change_rejected: <SwapOutlined />,
  timesheet_entry: <DollarOutlined />,
  invoice_created: <DollarOutlined />,
  payment_recorded: <DollarOutlined />,
}

function formatTimeAgo(timestamp: string): string {
  const t = new Date(timestamp).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

function labelForAction(action: string): string {
  if (action && action in actionLabels) {
    return actionLabels[action as AuditAction]
  }
  if (action) {
    return action.replace(/_/g, ' ')
  }
  return 'Activity'
}

export function RecentActivity() {
  const { selectedProjectId } = useProjectContext()
  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'recent-activity', selectedProjectId],
    queryFn: () => dashboardService.getRecentActivity(5, selectedProjectId),
  })

  return (
    <Card className="rounded-xl border border-[var(--border)]" title="Recent Activity">
      {isError && (
        <p className="text-[var(--text-secondary)] text-sm m-0">Could not load activity.</p>
      )}
      {!isError && (
        <List
          loading={isLoading}
          dataSource={logs || []}
          locale={{ emptyText: 'No recent activity yet.' }}
          renderItem={(item: AuditLog) => {
            const action = item.action as AuditAction
            const icon = actionIcons[action] ?? <PlusOutlined />
            const label = labelForAction(item.action)
            const project = item.projectName?.trim() || 'General'
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={icon}
                  title={`${label} — ${project}`}
                  description={`${item.userName?.trim() || '—'} · ${formatTimeAgo(item.timestamp)}`}
                />
              </List.Item>
            )
          }}
        />
      )}
    </Card>
  )
}
