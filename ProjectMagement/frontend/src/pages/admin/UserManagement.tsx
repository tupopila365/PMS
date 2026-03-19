import { Table, Tag, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { mockUsers } from '../../mocks/data'
import { PageHeader } from '../../components/layout/PageHeader'

export function UserManagement() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => mockUsers,
  })

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag>{r}</Tag> },
    { title: 'Action', key: 'action', render: () => <Button type="link">Edit</Button> },
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        actions={
          <Button type="primary" icon={<PlusOutlined />}>Add User</Button>
        }
      />
      <Table columns={columns} dataSource={users || []} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} />
    </div>
  )
}
