import { Table } from 'antd'
import type { RACIEntry } from '../../types'

interface RACIMatrixProps {
  entries: RACIEntry[]
}

export function RACIMatrix({ entries }: RACIMatrixProps) {
  return (
    <Table<RACIEntry>
      dataSource={entries}
      rowKey="id"
      columns={[
        { title: 'Deliverable / Task', dataIndex: 'deliverable', key: 'deliverable', width: 200 },
        { title: 'R (Responsible)', dataIndex: 'responsible', key: 'responsible', width: 120 },
        { title: 'A (Accountable)', dataIndex: 'accountable', key: 'accountable', width: 120 },
        { title: 'C (Consulted)', dataIndex: 'consulted', key: 'consulted', render: (v: string[] | undefined) => Array.isArray(v) ? v.join(', ') : v },
        { title: 'I (Informed)', dataIndex: 'informed', key: 'informed', render: (v: string[] | undefined) => Array.isArray(v) ? v.join(', ') : v },
      ]}
    />
  )
}
