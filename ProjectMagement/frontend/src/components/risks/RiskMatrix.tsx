import React from 'react'
import { Card } from 'antd'
import './RiskMatrix.css'
import type { Risk } from '../../types'

const IMPACT_LABELS = ['1', '2', '3', '4', '5']
const PROB_LABELS = ['1', '2', '3', '4', '5']

function getSeverityStyles(severity: Risk['severity']) {
  switch (severity) {
    case 'critical':
      return { bg: 'rgba(220, 38, 38, 0.35)', border: 'rgba(220, 38, 38, 0.6)', text: '#fca5a5' }
    case 'high':
      return { bg: 'rgba(234, 88, 12, 0.35)', border: 'rgba(234, 88, 12, 0.6)', text: '#fdba74' }
    case 'medium':
      return { bg: 'rgba(234, 179, 8, 0.35)', border: 'rgba(234, 179, 8, 0.6)', text: '#fde047' }
    case 'low':
      return { bg: 'rgba(22, 163, 74, 0.35)', border: 'rgba(22, 163, 74, 0.6)', text: '#86efac' }
    default:
      return { bg: 'transparent', border: 'transparent', text: 'inherit' }
  }
}

const LEGEND_ITEMS: { severity: Risk['severity']; label: string }[] = [
  { severity: 'low', label: 'Low' },
  { severity: 'medium', label: 'Medium' },
  { severity: 'high', label: 'High' },
  { severity: 'critical', label: 'Critical' },
]

interface RiskMatrixProps {
  risks: Risk[]
  onRiskClick?: (risk: Risk) => void
}

export function RiskMatrix({ risks, onRiskClick }: RiskMatrixProps) {
  const riskByCell = risks.reduce<Record<string, Risk[]>>((acc, r) => {
    const key = `${r.probability}-${r.impact}`
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <Card
      title="Risk Matrix (Probability × Impact)"
      className="rounded-xl border-[var(--border)] shadow-sm overflow-hidden"
      styles={{ body: { padding: 20 } }}
    >
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
        <span>Low</span>
        <span className="text-[10px] uppercase tracking-wider">Probability</span>
        <span>High</span>
      </div>
      <div className="risk-matrix-grid">
        <div />
        {IMPACT_LABELS.map((l) => (
          <div key={l} className="risk-matrix-header">
            {l}
          </div>
        ))}
        {PROB_LABELS.map((prob) => (
          <React.Fragment key={prob}>
            <div className="risk-matrix-row-label">{prob}</div>
            {IMPACT_LABELS.map((_, ii) => {
              const impact = ii + 1
              const key = `${prob}-${impact}`
              const cellRisks = riskByCell[key] || []
              const maxSeverity = cellRisks.reduce<Risk['severity'] | null>((m, r) => {
                const order = ['low', 'medium', 'high', 'critical']
                if (!m) return r.severity
                return order.indexOf(r.severity) > order.indexOf(m) ? r.severity : m
              }, null)
              const styles = maxSeverity ? getSeverityStyles(maxSeverity) : null
              return (
                <div
                  key={key}
                  className="risk-matrix-cell"
                  style={{
                    backgroundColor: styles?.bg ?? 'var(--surface-muted)',
                    borderColor: styles?.border ?? 'var(--border)',
                    cursor: cellRisks.length ? 'pointer' : undefined,
                  }}
                  onClick={() => cellRisks[0] && onRiskClick?.(cellRisks[0])}
                >
                  {cellRisks.map((r) => (
                    <div
                      key={r.id}
                      className="risk-matrix-cell-text"
                      style={{ color: styles?.text }}
                      title={r.description}
                    >
                      {r.description.length > 25 ? r.description.slice(0, 25) + '…' : r.description}
                    </div>
                  ))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        {LEGEND_ITEMS.map(({ severity, label }) => {
          const s = getSeverityStyles(severity)
          return (
            <div key={severity} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: s.bg, border: `2px solid ${s.border}` }}
              />
              <span className="text-[var(--text-muted)]">{label}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
