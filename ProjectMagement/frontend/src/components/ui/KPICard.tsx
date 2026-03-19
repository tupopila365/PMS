import { Card, Statistic } from 'antd'
import { tokens } from '../../theme/tokens'

const variantStyles = {
  default: {
    accentColor: tokens.colors.primary,
    iconBg: tokens.colors.primaryLight,
    iconColor: tokens.colors.primary,
  },
  success: {
    accentColor: tokens.colors.success,
    iconBg: tokens.colors.successLight,
    iconColor: tokens.colors.success,
  },
  warning: {
    accentColor: tokens.colors.warning,
    iconBg: tokens.colors.warningLight,
    iconColor: tokens.colors.warning,
  },
  danger: {
    accentColor: tokens.colors.danger,
    iconBg: tokens.colors.dangerLight,
    iconColor: tokens.colors.danger,
  },
}

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
  const styles = variantStyles[variant]

  const iconWithBadge = prefix ? (
    <span
      className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] mr-3 text-lg"
      style={{
        background: styles.iconBg,
        color: styles.iconColor,
      }}
    >
      {prefix}
    </span>
  ) : null

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`rounded-xl overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''
      }`}
      style={{
        borderLeft: `4px solid ${styles.accentColor}`,
        boxShadow: tokens.shadows.md,
      }}
      styles={{
        body: { padding: '20px 24px', overflow: 'hidden', minWidth: 0 },
      }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={iconWithBadge}
        suffix={suffix}
        formatter={formatter}
        valueStyle={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)' }}
      />
    </Card>
  )
}
