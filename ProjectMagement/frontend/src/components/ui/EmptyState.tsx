import { InboxOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  message?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ message = 'No data', description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-5xl mb-4 text-[var(--text-muted)]">
        {icon || <InboxOutlined />}
      </div>
      <div className="text-base font-medium text-[var(--text-primary)] mb-2">{message}</div>
      {description && (
        <div className="text-sm text-[var(--text-secondary)] mb-4 max-w-sm">{description}</div>
      )}
      {action}
    </div>
  )
}
