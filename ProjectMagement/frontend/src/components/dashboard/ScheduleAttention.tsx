import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, List, Tag, Empty } from 'antd'
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { taskService } from '../../services/taskService'
import { useProjectContext } from '../../context/ProjectContext'
import type { Task } from '../../types'
import { isTaskArchived } from '../../utils/taskFilters'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function ScheduleAttention() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', selectedProjectId],
    queryFn: () => taskService.getTasks(selectedProjectId),
  })

  const { overdue, qcFlags } = useMemo(() => {
    const t0 = todayISO()
    const od: Task[] = []
    const qc: Task[] = []
    for (const t of tasks) {
      if (t.status === 'completed' || isTaskArchived(t)) continue
      if (t.dueDate && t.dueDate < t0) od.push(t)
      if (t.sampleRequired || t.approvalRequired) qc.push(t)
    }
    od.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    return { overdue: od.slice(0, 8), qcFlags: qc.slice(0, 6) }
  }, [tasks])

  const hasAny = overdue.length > 0 || qcFlags.length > 0

  return (
    <Card
      className="rounded-xl border border-[var(--border)]"
      title={
        <span className="flex items-center gap-2">
          <WarningOutlined className="text-[var(--color-warning)]" />
          Schedule &amp; QC attention
        </span>
      }
      loading={isLoading}
    >
      {!hasAny && !isLoading ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No overdue tasks or QC flags in view." />
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <ClockCircleOutlined /> Overdue (potential cost / programme risk)
              </div>
              <List
                size="small"
                dataSource={overdue}
                renderItem={(t) => (
                  <List.Item className="!px-0">
                    <button
                      type="button"
                      className="text-left w-full hover:opacity-80"
                      onClick={() => navigate(`/projects/${t.projectId}`)}
                    >
                      <span className="text-[var(--text-primary)] font-medium">{t.title}</span>
                      <span className="text-[var(--text-secondary)] text-xs ml-2">Due {t.dueDate}</span>
                    </button>
                  </List.Item>
                )}
              />
            </div>
          )}
          {qcFlags.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">QC gates</div>
              <List
                size="small"
                dataSource={qcFlags}
                renderItem={(t) => (
                  <List.Item className="!px-0 flex flex-wrap gap-1">
                    <span className="text-[var(--text-primary)]">{t.title}</span>
                    {t.sampleRequired && <Tag color="blue">Sample</Tag>}
                    {t.approvalRequired && <Tag color="purple">Approval</Tag>}
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
