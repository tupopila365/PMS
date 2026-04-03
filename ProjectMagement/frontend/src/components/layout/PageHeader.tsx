import { Space } from 'antd'

interface PageHeaderProps {
  title: string
  subtitle?: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  /** Merges with defaults; use for full-bleed pages (e.g. Gantt). */
  className?: string
}

export function PageHeader({ title, subtitle, leading, actions, className }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0${className ? ` ${className}` : ''}`}>
      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
        {leading}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tracking-tight font-[var(--font-heading)] m-0 break-words">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 mb-0 break-words">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto [&_.ant-btn]:min-h-10 sm:[&_.ant-btn]:min-h-0">
          <Space wrap size="small" className="w-full sm:w-auto">
            {actions}
          </Space>
        </div>
      )}
    </div>
  )
}
