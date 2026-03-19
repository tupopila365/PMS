import { Card } from 'antd'
import type { Stakeholder } from '../../types'

interface StakeholderMapProps {
  stakeholders: Stakeholder[]
}

export function StakeholderMap({ stakeholders }: StakeholderMapProps) {
  return (
    <Card title="Stakeholder Map (Power × Interest)">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 300 }}>
        <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, backgroundColor: '#fafafa' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Low Power, High Interest</div>
          <div style={{ fontSize: 11 }}>Keep informed</div>
          {stakeholders.filter((s) => s.power < 4 && s.interest >= 4).map((s) => (
            <div key={s.id} style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
              <strong>{s.name}</strong> — {s.role}
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, backgroundColor: '#e6f7ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>High Power, High Interest</div>
          <div style={{ fontSize: 11 }}>Manage closely</div>
          {stakeholders.filter((s) => s.power >= 4 && s.interest >= 4).map((s) => (
            <div key={s.id} style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #91d5ff' }}>
              <strong>{s.name}</strong> — {s.role}
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, backgroundColor: '#fafafa' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Low Power, Low Interest</div>
          <div style={{ fontSize: 11 }}>Monitor</div>
          {stakeholders.filter((s) => s.power < 4 && s.interest < 4).map((s) => (
            <div key={s.id} style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
              <strong>{s.name}</strong> — {s.role}
            </div>
          ))}
        </div>
        <div style={{ border: '1px solid #d9d9d9', padding: 16, borderRadius: 8, backgroundColor: '#fff7e6' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>High Power, Low Interest</div>
          <div style={{ fontSize: 11 }}>Keep satisfied</div>
          {stakeholders.filter((s) => s.power >= 4 && s.interest < 4).map((s) => (
            <div key={s.id} style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, border: '1px solid #ffd591' }}>
              <strong>{s.name}</strong> — {s.role}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
