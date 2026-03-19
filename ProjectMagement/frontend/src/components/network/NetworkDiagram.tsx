import { useMemo } from 'react'
import { computeCriticalPath, type TaskWithSchedule } from '../../utils/criticalPath'
import type { Task } from '../../types'

interface NetworkDiagramProps {
  tasks: Task[]
}

export function NetworkDiagram({ tasks }: NetworkDiagramProps) {
  const scheduled = useMemo(() => computeCriticalPath(tasks), [tasks])

  const levels = useMemo(() => {
    const byLevel: TaskWithSchedule[][] = []
    const levelMap = new Map<string, number>()
    const getLevel = (t: TaskWithSchedule): number => {
      const cached = levelMap.get(t.id)
      if (cached !== undefined) return cached
      const preds = (t.predecessors || []).map((pid) => scheduled.find((s) => s.id === pid)).filter(Boolean) as TaskWithSchedule[]
      const l = preds.length === 0 ? 0 : 1 + Math.max(...preds.map(getLevel))
      levelMap.set(t.id, l)
      return l
    }
    for (const t of scheduled) {
      const l = getLevel(t)
      while (byLevel.length <= l) byLevel.push([])
      byLevel[l].push(t)
    }
    return byLevel
  }, [scheduled])

  const nodeWidth = 160
  const nodeHeight = 56
  const gapX = 48
  const gapY = 32
  const padding = 24

  const svgWidth = Math.max(640, levels.length * (nodeWidth + gapX) + padding * 2)
  const maxRows = Math.max(...levels.map((l) => l.length), 1)
  const svgHeight = Math.max(320, maxRows * (nodeHeight + gapY) - gapY + padding * 2)

  const getNodePos = (levelIndex: number, rowIndex: number) => {
    const x = padding + levelIndex * (nodeWidth + gapX)
    const y = padding + rowIndex * (nodeHeight + gapY)
    return {
      x,
      y,
      centerX: x + nodeWidth / 2,
      centerY: y + nodeHeight / 2,
      rightX: x + nodeWidth,
      leftX: x,
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--surface-muted)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Project Network Diagram (PERT)</h3>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Critical Path
        </span>
      </div>
      <div className="overflow-auto p-4 min-h-[340px]" style={{ background: 'var(--page-bg)' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-critical" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#dc2626" />
            </marker>
          </defs>
          {levels.flatMap((row, levelIndex) =>
            row.map((t, rowIndex) => {
              const pos = getNodePos(levelIndex, rowIndex)
              const preds = (t.predecessors || []).map((pid) => {
                const pt = scheduled.find((s) => s.id === pid)
                if (!pt) return null
                const pl = levels.findIndex((l) => l.some((x) => x.id === pt.id))
                const pi = levels[pl]?.findIndex((x) => x.id === pt.id) ?? 0
                const predPos = getNodePos(pl, pi)
                return { ...predPos, isCritical: t.isCritical }
              }).filter(Boolean) as { rightX: number; centerY: number; isCritical: boolean }[]

              return (
                <g key={t.id}>
                  {preds.map((p, j) => (
                    <line
                      key={j}
                      x1={p.rightX}
                      y1={p.centerY}
                      x2={pos.leftX}
                      y2={pos.centerY}
                      stroke={p.isCritical ? 'var(--color-danger)' : 'var(--border)'}
                      strokeWidth={p.isCritical ? 2.5 : 1.5}
                      strokeDasharray={p.isCritical ? 'none' : '4 4'}
                      markerEnd={p.isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                    />
                  ))}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={8}
                    fill={t.isCritical ? 'var(--surface)' : 'var(--surface)'}
                    stroke={t.isCritical ? 'var(--color-danger)' : 'var(--border)'}
                    strokeWidth={t.isCritical ? 2 : 1}
                  />
                  <text
                    x={pos.centerX}
                    y={pos.centerY - 6}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={500}
                    fill="var(--text-primary)"
                  >
                    {t.title.length > 18 ? t.title.slice(0, 18) + '…' : t.title}
                  </text>
                  <text
                    x={pos.centerX}
                    y={pos.centerY + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--text-secondary)"
                  >
                    {t.duration ?? 1}d {t.slack > 0 ? `(${t.slack}d slack)` : 'CP'}
                  </text>
                </g>
              )
            })
          )}
        </svg>
      </div>
    </div>
  )
}
