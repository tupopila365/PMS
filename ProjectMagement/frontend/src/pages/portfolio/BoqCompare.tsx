import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Select, Button, Table, Typography, Alert, Card, message } from 'antd'
import axios from 'axios'
import { PageHeader } from '../../components/layout/PageHeader'
import { projectService } from '../../services/projectService'
import { boqService } from '../../services/projectComplianceService'
import type { BoqCompareRow } from '../../types'

function compareErrorText(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | string | undefined
    if (typeof d === 'string' && d.trim()) return d
    if (d && typeof d === 'object') {
      if (typeof d.message === 'string' && d.message.trim()) return d.message
      if (typeof d.error === 'string' && d.error.trim()) return d.error
    }
    if (err.response?.status) return `Request failed (${err.response.status})`
  }
  if (err instanceof Error && err.message) return err.message
  return 'Could not load comparison'
}

export function BoqCompare() {
  const [ids, setIds] = useState<string[]>([])

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const compareMut = useMutation({
    mutationFn: () => boqService.compare(ids),
    onSuccess: (data) => {
      const n = data.rows?.length ?? 0
      if (n > 0) {
        message.success(`Compared ${n} item code${n === 1 ? '' : 's'}`)
      }
    },
  })

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }))

  const meta = compareMut.data?.projects ?? []
  const columns = [
    {
      title: 'Item code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      fixed: 'left' as const,
      width: 140,
      render: (t: string, r: BoqCompareRow) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{t}</div>
          {r.description && <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{r.description}</div>}
        </div>
      ),
    },
    ...meta.map((p) => ({
      title: p.name,
      key: p.id,
      width: 160,
      render: (_: unknown, row: BoqCompareRow) => {
        const cell = row.byProject[p.id]
        if (!cell) return <span className="text-[var(--text-muted)]">—</span>
        return (
          <div className="text-xs leading-snug">
            <div>Qty: {cell.quantity != null ? Number(cell.quantity).toLocaleString() : '—'}</div>
            <div>Rate: {cell.rate != null ? `$${Number(cell.rate).toLocaleString()}` : '—'}</div>
            <div className="font-medium">Amt: {cell.amount != null ? `$${Number(cell.amount).toLocaleString()}` : '—'}</div>
          </div>
        )
      },
    })),
  ]

  return (
    <div>
      <PageHeader
        title="BOQ compare"
        subtitle="Align bill-of-quantities lines by item code across projects you can access (requires imported BOQ on each)."
      />

      <Card className="rounded-xl border border-[var(--border)] mb-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <Typography.Text type="secondary" className="text-xs block mb-1">
              Select at least two projects
            </Typography.Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Choose projects"
              className="w-full"
              options={projectOptions}
              value={ids}
              onChange={setIds}
              optionFilterProp="label"
            />
          </div>
          <Button
            type="primary"
            disabled={ids.length < 2}
            loading={compareMut.isPending}
            onClick={() => compareMut.mutate()}
          >
            Run compare
          </Button>
        </div>
      </Card>

      {compareMut.isError && (
        <Alert
          type="error"
          message="Could not load comparison"
          description={compareErrorText(compareMut.error)}
          className="mb-4 rounded-lg"
          showIcon
        />
      )}

      {compareMut.data && compareMut.data.rows.length === 0 && (
        <Alert
          type="info"
          showIcon
          className="mb-4 rounded-lg"
          message="No BOQ lines to compare yet"
          description={
            <div className="text-sm space-y-2">
              <p className="m-0">
                Compare only includes rows that have an <Typography.Text code>itemCode</Typography.Text> (or{' '}
                <Typography.Text code>code</Typography.Text> / <Typography.Text code>item_code</Typography.Text> in the CSV).
                Import a BOQ CSV on each selected project&apos;s <strong>BOQ</strong> tab, then run compare again.
              </p>
              <ul className="m-0 pl-4 list-disc">
                {ids.map((pid) => {
                  const p = projects.find((x) => x.id === pid)
                  return (
                    <li key={pid}>
                      <Link to={`/projects/${pid}`} className="text-[var(--color-primary)]">
                        {p?.name ?? pid}
                      </Link>
                      {' — open BOQ tab → Import CSV'}
                    </li>
                  )
                })}
              </ul>
            </div>
          }
        />
      )}

      {compareMut.data && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <Table<BoqCompareRow>
            size="small"
            rowKey="itemCode"
            pagination={{ pageSize: 15, showSizeChanger: true }}
            dataSource={compareMut.data.rows}
            columns={columns}
            scroll={{ x: Math.max(400, 140 + meta.length * 160) }}
            locale={{
              emptyText:
                compareMut.data.rows.length === 0
                  ? 'Import BOQ data on each project (see note above).'
                  : 'No data',
            }}
          />
        </div>
      )}
    </div>
  )
}
