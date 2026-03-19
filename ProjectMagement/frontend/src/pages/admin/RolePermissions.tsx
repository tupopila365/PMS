import { Table, Tag, Card } from 'antd'
import { PageHeader } from '../../components/layout/PageHeader'
import type { UserRole } from '../../types'

const rolePermissions = [
  { role: 'admin' as UserRole, access: 'Full access', description: 'All permissions' },
  { role: 'project_manager' as UserRole, access: 'Manage projects', description: 'Create, edit, assign projects and tasks' },
  { role: 'engineer' as UserRole, access: 'Edit workflows', description: 'Modify workflow steps and designs' },
  { role: 'contractor' as UserRole, access: 'Field updates', description: 'Update task status, upload media' },
  { role: 'accountant' as UserRole, access: 'Finance', description: 'Invoices, payments, reports' },
  { role: 'vendor' as UserRole, access: 'View + log', description: 'View assigned projects, log proof of work' },
]

export function RolePermissions() {
  const columns = [
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: UserRole) => <Tag color="blue">{r.replace('_', ' ')}</Tag> },
    { title: 'Access', dataIndex: 'access', key: 'access' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ]

  return (
    <div>
      <PageHeader title="Role Permissions" subtitle="Manage role-based access control." />
      <Card styles={{ body: { padding: 16 } }}>
        <Table columns={columns} dataSource={rolePermissions} rowKey="role" pagination={false} />
      </Card>
    </div>
  )
}
