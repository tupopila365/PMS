import { useMemo } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { DollarOutlined, RiseOutlined, FallOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { computeEVM, type EVMMetrics } from '../../utils/evm'
import type { Task, Project } from '../../types'
import type { TimesheetEntry } from '../../types'
import type { CostCategory } from '../../types'

interface EVMDashboardProps {
  project: Project
  tasks: Task[]
  timesheetEntries?: TimesheetEntry[]
  costCategories?: CostCategory[]
}

export function EVMDashboard({ project, tasks, timesheetEntries, costCategories }: EVMDashboardProps) {
  const metrics = useMemo(
    () => computeEVM(project, tasks, { timesheetEntries, costCategories }),
    [project, tasks, timesheetEntries, costCategories]
  )

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="BAC (Budget at Completion)" value={metrics.bac} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="PV (Planned Value)" value={metrics.pv} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="EV (Earned Value)" value={metrics.ev} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="AC (Actual Cost)" value={metrics.ac} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="CPI" value={metrics.cpi.toFixed(2)} prefix={metrics.cpi >= 1 ? <RiseOutlined /> : <FallOutlined />} valueStyle={{ color: metrics.cpi >= 1 ? '#52c41a' : '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="SPI" value={metrics.spi.toFixed(2)} prefix={metrics.spi >= 1 ? <RiseOutlined /> : <FallOutlined />} valueStyle={{ color: metrics.spi >= 1 ? '#52c41a' : '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="EAC" value={metrics.eac} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="VAC" value={metrics.vac} prefix={<DollarOutlined />} formatter={(v) => `$${Number(v).toLocaleString()}`} valueStyle={{ color: metrics.vac >= 0 ? '#52c41a' : '#cf1322' }} />
          </Card>
        </Col>
        {metrics.hoursLogged != null && (
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Hours Logged" value={metrics.hoursLogged} prefix={<ClockCircleOutlined />} suffix="h" />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
