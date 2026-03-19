import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { WarningOutlined, ClockCircleOutlined, DollarOutlined, FlagOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { alertService } from '../../services/alertService'
import { useProjectContext } from '../../context/ProjectContext'
import type { RiskAlert } from '../../types'

const typeConfig = {
  schedule: { icon: ClockCircleOutlined, label: 'Schedule', color: 'var(--color-warning)' },
  cost: { icon: DollarOutlined, label: 'Cost', color: 'var(--color-danger)' },
  milestone: { icon: FlagOutlined, label: 'Milestone', color: 'var(--color-primary)' },
} as const

export function RiskAlertsBanner() {
  const navigate = useNavigate()
  const { setSelectedProjectId } = useProjectContext()
  const { data: alerts } = useQuery({
    queryKey: ['riskAlerts'],
    queryFn: alertService.getRiskAlerts,
  })

  if (!alerts?.length) return null

  const handleAlertClick = (projectId: string) => {
    setSelectedProjectId(projectId)
    navigate(`/risks?project=${projectId}`, { replace: true })
  }

  const displayAlerts = alerts.slice(0, 3)
  const remainingCount = alerts.length - 3

  return (
    <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm max-h-[220px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-muted)] bg-[var(--surface-muted)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <WarningOutlined className="text-sm" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Risk Alerts</h3>
          <span className="text-xs text-[var(--text-muted)]">({alerts.length})</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedProjectId(undefined)
            navigate('/risks')
          }}
          className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
        >
          View all <ArrowRightOutlined className="text-[10px]" />
        </button>
      </div>

      <div className="divide-y divide-[var(--border-muted)] overflow-y-auto flex-1 min-h-0">
        {displayAlerts.map((alert) => {
          const config = typeConfig[alert.type]
          const Icon = config.icon
          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => handleAlertClick(alert.projectId)}
              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--surface-muted)] transition-colors group"
            >
              <div
                className="flex items-center justify-center w-6 h-6 rounded shrink-0"
                style={{ background: `${config.color}20`, color: config.color }}
              >
                <Icon className="text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-[var(--text-primary)] text-sm group-hover:text-[var(--color-primary)] transition-colors">
                    {alert.projectName}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background: `${config.color}15`, color: config.color }}
                  >
                    {config.label}
                  </span>
                  {alert.severity === 'high' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400">
                      High
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 truncate">{alert.message}</p>
              </div>
              <ArrowRightOutlined className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
            </button>
          )
        })}
        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(undefined)
              navigate('/risks')
            }}
            className="w-full text-left px-3 py-2 text-xs text-[var(--color-primary)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    </div>
  )
}
