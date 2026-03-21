import { Table, Tag, Card } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/layout/PageHeader'
import { roleCatalogService } from '../../services/roleCatalogService'
import { PageLoader } from '../../components/ui/PageLoader'
import type { UserRole } from '../../types'

export function RolePermissions() {
  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ['roles', 'catalog'],
    queryFn: roleCatalogService.getRoleCatalog,
  })

  const columns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (r: UserRole) => <Tag color="blue">{r.replace('_', ' ')}</Tag>,
    },
    { title: 'Access', dataIndex: 'access', key: 'access' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ]

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader title="Role Permissions" subtitle="Manage role-based access control." />
      <Card styles={{ body: { padding: 16 } }}>
        <Table columns={columns} dataSource={rolePermissions} rowKey="role" pagination={false} />
      </Card>
    </div>
  )
}
