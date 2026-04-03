import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Alert } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type UpdateUserPayload } from '../../services/userService'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import type { User, UserRole } from '../../types'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'project_manager', label: 'Project manager' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'vendor', label: 'Vendor' },
]

/** Values should match project `type` strings (case-insensitive on the server). */
const DISCIPLINE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All types (no discipline filter)' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'civil', label: 'Civil' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'structural', label: 'Structural' },
]

export function UserManagement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { can } = usePermissions()
  const canManage = can('admin:users')
  const companyId = user?.companyId || '1'

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => userService.getUsers(companyId),
  })

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('User created')
      setAddOpen(false)
      addForm.resetFields()
    },
    onError: (err: { response?: { status?: number; data?: unknown } }) => {
      if (err.response?.status === 403) message.error('Only administrators can create users')
      else if (err.response?.status === 409) message.error('That email is already in use')
      else message.error('Could not create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => userService.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('User updated')
      setEditOpen(false)
      setEditingUser(null)
      editForm.resetFields()
    },
    onError: (err: { response?: { status?: number } }) => {
      if (err.response?.status === 403) message.error('Only administrators can edit users')
      else if (err.response?.status === 409) message.error('That email is already in use')
      else message.error('Could not update user')
    },
  })

  const openEdit = (u: User) => {
    setEditingUser(u)
    editForm.setFieldsValue({
      name: u.name,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      discipline: u.discipline ?? '',
    })
    setEditOpen(true)
  }

  const submitAdd = (values: {
    name: string
    email: string
    role: UserRole
    password: string
    discipline?: string
  }) => {
    createMutation.mutate({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      password: values.password,
      companyId,
      discipline: values.discipline?.trim() ? values.discipline.trim() : undefined,
    })
  }

  const submitEdit = (values: {
    name: string
    email: string
    role: UserRole
    password?: string
    companyId?: string
    discipline?: string
  }) => {
    if (!editingUser) return
    const payload: UpdateUserPayload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      companyId: values.companyId || companyId,
      discipline: values.discipline?.trim() ?? '',
    }
    if (values.password && values.password.length > 0) {
      payload.password = values.password
    }
    updateMutation.mutate({ id: editingUser.id, payload })
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag>{r.replace(/_/g, ' ')}</Tag> },
    {
      title: 'Discipline',
      dataIndex: 'discipline',
      key: 'discipline',
      render: (d: string | undefined) => (d && d.trim() ? <Tag>{d}</Tag> : <span className="text-[var(--text-muted)]">All types</span>),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: User) =>
        canManage ? (
          <Button type="link" onClick={() => openEdit(record)}>
            Edit
          </Button>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        actions={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              Add User
            </Button>
          ) : undefined
        }
      />

      {!canManage && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="View only"
          description="Only administrators can add or edit users. You can still browse the directory for your organization."
        />
      )}

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title="Add user"
        open={addOpen}
        onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={submitAdd}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input placeholder="email@company.com" autoComplete="off" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]} initialValue="contractor">
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="discipline"
            label="Discipline filter"
            tooltip="For engineers, contractors, and vendors: restrict visible projects to this project type. Admins, project managers, and accountants always see all projects in the company."
            initialValue=""
          >
            <Select allowClear options={DISCIPLINE_OPTIONS} placeholder="All types" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Initial password"
            rules={[{ required: true, min: 4, message: 'At least 4 characters' }]}
          >
            <Input.Password placeholder="Min. 4 characters" autoComplete="new-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>
              Create user
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit user"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditingUser(null); editForm.resetFields() }}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={submitEdit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="discipline"
            label="Discipline filter"
            tooltip="Must match project type for scoped users. Clear for all types."
          >
            <Select allowClear options={DISCIPLINE_OPTIONS} placeholder="All types" />
          </Form.Item>
          <Form.Item name="password" label="New password">
            <Input.Password placeholder="Leave blank to keep current password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending} block>
              Save changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
