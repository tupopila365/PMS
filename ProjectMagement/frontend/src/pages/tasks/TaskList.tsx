import { useNavigate } from 'react-router-dom'
import { Button, Space } from 'antd'
import { AppstoreOutlined, BarChartOutlined, ApartmentOutlined } from '@ant-design/icons'
import { TaskTable } from '../../components/tables/TaskTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { useProjectContext } from '../../context/ProjectContext'

export function TaskList() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Manage and track your project tasks."
        actions={
          <Space wrap>
            <Button type="primary">List</Button>
            <Button icon={<AppstoreOutlined />} onClick={() => navigate('/tasks/board')}>Board</Button>
            <Button icon={<BarChartOutlined />} onClick={() => navigate('/tasks/gantt')}>Gantt</Button>
            <Button icon={<ApartmentOutlined />} onClick={() => navigate('/tasks/network')}>Network</Button>
          </Space>
        }
      />
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <TaskTable projectId={selectedProjectId} />
      </div>
    </div>
  )
}
