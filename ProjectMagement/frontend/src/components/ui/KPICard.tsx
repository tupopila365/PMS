import { Card } from 'antd'

/** Subdued icon tint — classic dashboards avoid loud accent blocks. */
const variantIconClass = {
  default: 'text-[var(--text-secondary)]',
  success: 'text-[var(--text-secondary)] dark:text-emerald-500/85',
  warning: 'text-[var(--text-secondary)] dark:text-amber-500/85',
  danger: 'text-red-700 dark:text-red-400/90',
} as const

interface KPICardProps {
  title: string
  value: React.ReactNode
  prefix?: React.ReactNode
  suffix?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  onClick?: () => void
  formatter?: (value: unknown) => React.ReactNode
}

export function KPICard({
  title,
  value,
  prefix,
  suffix,
  variant = 'default',
  onClick,
  formatter,
}: KPICardProps) {
  const iconClass = variantIconClass[variant]

  const displayValue = formatter ? formatter(value) : value

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-none ${
        onClick ? 'cursor-pointer hover:border-[var(--border-strong)]' : ''
      }`}
      styles={{
        body: { padding: '16px 18px', overflow: 'hidden', minWidth: 0 },
      }}
    >
      <div className="flex gap-3 items-start min-w-0">
        {prefix ? (
          <span className={`shrink-0 text-lg leading-none mt-0.5 ${iconClass}`} aria-hidden>
            {prefix}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 leading-tight">
            {title}
          </div>
          <div className="text-xl font-semibold tabular-nums text-[var(--text-primary)] leading-snug tracking-tight">
            {displayValue}
            {suffix ? <span className="text-base font-medium text-[var(--text-secondary)] ml-0.5">{suffix}</span> : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
