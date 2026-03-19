import { Card } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '../../theme/ThemeContext'
import type { Stakeholder } from '../../types'

interface StakeholderMapProps {
  stakeholders: Stakeholder[]
}

type QuadrantStyle = {
  cell: CSSProperties
  chip: CSSProperties
  title: CSSProperties
  strategy: CSSProperties
  name: CSSProperties
}

function quadrantStyles(isDark: boolean): Record<'neutral' | 'blue' | 'amber', QuadrantStyle> {
  if (isDark) {
    return {
      neutral: {
        cell: {
          border: '1px solid var(--border)',
          padding: 16,
          borderRadius: 8,
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
        },
        chip: {
          marginTop: 8,
          padding: 8,
          borderRadius: 4,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        },
        title: { fontSize: 12, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 600 },
        strategy: { fontSize: 11, color: 'var(--text-secondary)' },
        name: { color: 'var(--text-primary)' },
      },
      blue: {
        cell: {
          border: '1px solid rgba(59, 130, 246, 0.35)',
          padding: 16,
          borderRadius: 8,
          backgroundColor: 'rgba(37, 99, 235, 0.14)',
        },
        chip: {
          marginTop: 8,
          padding: 8,
          borderRadius: 4,
          background: 'var(--surface-elevated)',
          border: '1px solid rgba(59, 130, 246, 0.45)',
          color: 'var(--text-primary)',
        },
        title: { fontSize: 12, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 600 },
        strategy: { fontSize: 11, color: 'var(--text-secondary)' },
        name: { color: 'var(--text-primary)' },
      },
      amber: {
        cell: {
          border: '1px solid rgba(234, 88, 12, 0.35)',
          padding: 16,
          borderRadius: 8,
          backgroundColor: 'rgba(234, 88, 12, 0.12)',
        },
        chip: {
          marginTop: 8,
          padding: 8,
          borderRadius: 4,
          background: 'var(--surface-elevated)',
          border: '1px solid rgba(234, 88, 12, 0.4)',
          color: 'var(--text-primary)',
        },
        title: { fontSize: 12, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 600 },
        strategy: { fontSize: 11, color: 'var(--text-secondary)' },
        name: { color: 'var(--text-primary)' },
      },
    }
  }
  return {
    neutral: {
      cell: { border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, backgroundColor: '#fafafa' },
      chip: {
        marginTop: 8,
        padding: 8,
        background: '#fff',
        borderRadius: 4,
        border: '1px solid #e8e8e8',
        color: '#0f172a',
      },
      title: { fontSize: 12, color: '#475569', marginBottom: 8, fontWeight: 600 },
      strategy: { fontSize: 11, color: '#64748b' },
      name: { color: '#0f172a' },
    },
    blue: {
      cell: { border: '1px solid #91d5ff', padding: 16, borderRadius: 8, backgroundColor: '#e6f7ff' },
      chip: {
        marginTop: 8,
        padding: 8,
        background: '#fff',
        borderRadius: 4,
        border: '1px solid #91d5ff',
        color: '#0f172a',
      },
      title: { fontSize: 12, color: '#0c4a6e', marginBottom: 8, fontWeight: 600 },
      strategy: { fontSize: 11, color: '#0369a1' },
      name: { color: '#0f172a' },
    },
    amber: {
      cell: { border: '1px solid #ffd591', padding: 16, borderRadius: 8, backgroundColor: '#fff7e6' },
      chip: {
        marginTop: 8,
        padding: 8,
        background: '#fff',
        borderRadius: 4,
        border: '1px solid #ffd591',
        color: '#0f172a',
      },
      title: { fontSize: 12, color: '#9a3412', marginBottom: 8, fontWeight: 600 },
      strategy: { fontSize: 11, color: '#c2410c' },
      name: { color: '#0f172a' },
    },
  }
}

function Quadrant({
  style,
  title,
  strategy,
  children,
}: {
  style: QuadrantStyle
  title: string
  strategy: string
  children: ReactNode
}) {
  return (
    <div style={style.cell}>
      <div style={style.title}>{title}</div>
      <div style={style.strategy}>{strategy}</div>
      {children}
    </div>
  )
}

export function StakeholderMap({ stakeholders }: StakeholderMapProps) {
  const { isDark } = useTheme()
  const q = quadrantStyles(isDark)

  const chip = (style: QuadrantStyle, s: Stakeholder) => (
    <div key={s.id} style={style.chip}>
      <strong style={style.name}>{s.name}</strong>
      <span style={style.name}> — {s.role}</span>
    </div>
  )

  return (
    <Card title="Stakeholder Map (Power × Interest)">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 300 }}>
        <Quadrant style={q.neutral} title="Low Power, High Interest" strategy="Keep informed">
          {stakeholders.filter((s) => s.power < 4 && s.interest >= 4).map((s) => chip(q.neutral, s))}
        </Quadrant>
        <Quadrant style={q.blue} title="High Power, High Interest" strategy="Manage closely">
          {stakeholders.filter((s) => s.power >= 4 && s.interest >= 4).map((s) => chip(q.blue, s))}
        </Quadrant>
        <Quadrant style={q.neutral} title="Low Power, Low Interest" strategy="Monitor">
          {stakeholders.filter((s) => s.power < 4 && s.interest < 4).map((s) => chip(q.neutral, s))}
        </Quadrant>
        <Quadrant style={q.amber} title="High Power, Low Interest" strategy="Keep satisfied">
          {stakeholders.filter((s) => s.power >= 4 && s.interest < 4).map((s) => chip(q.amber, s))}
        </Quadrant>
      </div>
    </Card>
  )
}
