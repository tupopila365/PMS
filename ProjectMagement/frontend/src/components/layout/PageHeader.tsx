import { Space } from 'antd'

interface PageHeaderProps {
  title: string
  subtitle?: string
  leading?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, leading, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
      <div className="flex items-center gap-4">
        {leading}
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight font-[var(--font-heading)] m-0">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 mb-0">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 shrink-0">
          <Space wrap size="small">
            {actions}
          </Space>
        </div>
      )}
    </div>
  )
}
