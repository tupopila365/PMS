import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { WarningOutlined, ClockCircleOutlined, DollarOutlined, FlagOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { alertService } from '../../services/alertService'
import { useProjectContext } from '../../context/ProjectContext'
const typeConfig = {
  schedule: { icon: ClockCircleOutlined, label: 'Schedule' },
  cost: { icon: DollarOutlined, label: 'Cost' },
  milestone: { icon: FlagOutlined, label: 'Milestone' },
} as const

export function RiskAlertsBanner() {
  const navigate = useNavigate()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const { data: alerts } = useQuery({
    queryKey: ['riskAlerts', selectedProjectId],
    queryFn: () => alertService.getRiskAlerts(selectedProjectId),
  })

  if (!alerts?.length) return null

  const handleAlertClick = (projectId: string) => {
    setSelectedProjectId(projectId)
    navigate(`/risks?project=${projectId}`, { replace: true })
  }

  const displayAlerts = alerts.slice(0, 3)
  const remainingCount = alerts.length - 3

  return (
    <div className="mb-4 rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden max-h-[220px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <WarningOutlined className="text-[var(--text-secondary)] text-base" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Risk Alerts</h3>
          <span className="text-xs text-[var(--text-muted)] tabular-nums">({alerts.length})</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedProjectId(undefined)
            navigate('/risks')
          }}
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-2 hover:underline"
        >
          View all <ArrowRightOutlined className="text-[10px]" />
        </button>
      </div>

      <div className="divide-y divide-[var(--border)] overflow-y-auto flex-1 min-h-0">
        {displayAlerts.map((alert) => {
          const config = typeConfig[alert.type]
          const Icon = config.icon
          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => handleAlertClick(alert.projectId)}
              className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-[var(--surface-muted)] transition-colors group"
            >
              <Icon className="text-sm text-[var(--text-muted)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[var(--text-primary)] text-sm">{alert.projectName}</span>
                  <span className="text-[10px] font-medium px-1.5 py-px border border-[var(--border)] rounded-sm bg-[var(--surface)] text-[var(--text-secondary)]">
                    {config.label}
                  </span>
                  {alert.severity === 'high' && (
                    <span className="text-[10px] font-medium px-1.5 py-px border border-red-800/35 dark:border-red-500/40 rounded-sm text-red-800 dark:text-red-400">
                      High
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5 leading-snug">{alert.message}</p>
              </div>
              <ArrowRightOutlined className="text-[10px] text-[var(--text-muted)] shrink-0 mt-1" />
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
            className="w-full text-left px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    </div>
  )
}
