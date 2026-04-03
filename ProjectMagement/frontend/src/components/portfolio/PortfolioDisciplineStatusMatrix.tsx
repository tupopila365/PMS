import { useMemo } from 'react'
import { Card, Table, Typography, Empty, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Project } from '../../types'
import { formatProjectTypeLabel } from '../../utils/projectType'
import {
  buildDisciplineStatusMatrix,
  columnTotal,
  formatPortfolioBudget,
  grandTotal,
  PIPELINE_STATUS_LABELS,
  rowTotal,
  type PortfolioCell,
} from '../../utils/portfolioAggregation'

function CellContent({ cell }: { cell: PortfolioCell }) {
  if (cell.count === 0) {
    return <span className="text-[var(--text-muted)]">—</span>
  }
  return (
    <div className="text-xs leading-snug">
      <div className="font-semibold text-[var(--text-primary)]">
        {cell.count} {cell.count === 1 ? 'project' : 'projects'}
      </div>
      <div className="text-[var(--text-muted)]">{formatPortfolioBudget(cell.budget)}</div>
    </div>
  )
}

interface PortfolioDisciplineStatusMatrixProps {
  projects: Project[]
  loading?: boolean
  /** When set, user has narrowed to a single project in the header. */
  filteredToSingleProject?: boolean
}

export function PortfolioDisciplineStatusMatrix({
  projects,
  loading,
  filteredToSingleProject,
}: PortfolioDisciplineStatusMatrixProps) {
  const { disciplines, matrix, columnKeys } = useMemo(() => buildDisciplineStatusMatrix(projects), [projects])

  const dataSource = useMemo(
    () => disciplines.map((d) => ({ key: d, discipline: d })),
    [disciplines],
  )

  const columns: ColumnsType<{ key: string; discipline: string }> = useMemo(() => {
    const base: ColumnsType<{ key: string; discipline: string }> = [
      {
        title: 'Discipline (type)',
        dataIndex: 'discipline',
        key: 'discipline',
        fixed: 'left',
        width: 200,
        render: (d: string) => (
          <div>
            <div className="font-medium text-[var(--text-primary)]">{formatProjectTypeLabel(d)}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono">{d}</div>
          </div>
        ),
      },
    ]

    for (const status of columnKeys) {
      base.push({
        title: PIPELINE_STATUS_LABELS[status],
        key: `s-${status}`,
        align: 'center',
        width: 128,
        render: (_, row) => <CellContent cell={matrix[row.discipline][status]} />,
      })
    }

    base.push({
      title: 'Row total',
      key: 'row-total',
      fixed: 'right',
      width: 132,
      align: 'right',
      render: (_, row) => {
        const t = rowTotal(matrix, row.discipline, columnKeys)
        return (
          <div className="text-xs text-right">
            <div className="font-semibold text-[var(--text-primary)]">{t.count} total</div>
            <div className="text-[var(--text-muted)]">{formatPortfolioBudget(t.budget)}</div>
          </div>
        )
      },
    })

    return base
  }, [matrix, columnKeys])

  const runningLines = useMemo(() => {
    return disciplines.map((d) => {
      const t = rowTotal(matrix, d, columnKeys)
      if (t.count === 0) return null
      return (
        <li key={d} className="text-sm text-[var(--text-secondary)]">
          <Typography.Text strong className="text-[var(--text-primary)]">
            {t.count}
          </Typography.Text>{' '}
          {formatProjectTypeLabel(d)} {t.count === 1 ? 'project' : 'projects'} ={' '}
          <Typography.Text strong className="text-[var(--text-primary)]">
            {formatPortfolioBudget(t.budget)}
          </Typography.Text>{' '}
          <span className="text-[var(--text-muted)]">budget</span>
        </li>
      )
    })
  }, [disciplines, matrix, columnKeys])

  const gt = useMemo(() => grandTotal(matrix, disciplines, columnKeys), [matrix, disciplines, columnKeys])

  if (loading) {
    return (
      <Card className="rounded-xl border border-[var(--border)] shadow-none">
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card className="rounded-xl border border-[var(--border)] shadow-none">
        <Empty description="No projects in this scope" />
      </Card>
    )
  }

  return (
    <Card
      title="Discipline × pipeline status"
      className="rounded-xl border border-[var(--border)] shadow-none"
      styles={{
        header: {
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          fontWeight: 600,
          fontSize: 15,
        },
        body: { padding: '16px 20px 20px' },
      }}
    >
      {filteredToSingleProject && (
        <Typography.Paragraph type="secondary" className="text-xs !mb-3">
          Header filter is set to one project — totals below are for that project only. Choose &quot;All Projects&quot; for full
          portfolio aggregation.
        </Typography.Paragraph>
      )}

      <Typography.Title level={5} className="!mt-0 !mb-2 text-sm !font-semibold text-[var(--text-primary)]">
        Running totals by discipline
      </Typography.Title>
      <ul className="list-none pl-0 space-y-1 mb-5 m-0">{runningLines}</ul>

      <Typography.Paragraph type="secondary" className="text-xs !mb-3">
        Cells show project count and sum of <strong>budget</strong> per discipline and pipeline stage. Row and column totals
        match the filtered set.
      </Typography.Paragraph>

      <div className="overflow-x-auto rounded-lg border border-[var(--border-muted)]">
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={dataSource}
          columns={columns}
          scroll={{ x: Math.max(640, 200 + columnKeys.length * 128 + 132) }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-[var(--surface-muted)]/80 font-medium">
                <Table.Summary.Cell index={0}>
                  <span className="text-[var(--text-primary)]">Column totals</span>
                </Table.Summary.Cell>
                {columnKeys.map((status, i) => {
                  const t = columnTotal(matrix, disciplines, status)
                  return (
                    <Table.Summary.Cell key={status} index={i + 1} align="center">
                      <CellContent cell={t} />
                    </Table.Summary.Cell>
                  )
                })}
                <Table.Summary.Cell index={columnKeys.length + 1} align="right">
                  <div className="text-xs text-right">
                    <div className="font-semibold text-[var(--text-primary)]">{gt.count} projects</div>
                    <div className="text-[var(--text-muted)]">{formatPortfolioBudget(gt.budget)}</div>
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </div>
    </Card>
  )
}
