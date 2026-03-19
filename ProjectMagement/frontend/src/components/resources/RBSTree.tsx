import { Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { Resource } from '../../types'

const TYPE_LABELS: Record<Resource['type'], string> = {
  personnel: 'Personnel',
  equipment: 'Equipment',
  material: 'Materials',
  facility: 'Facilities',
}

function groupByType(resources: Resource[]): DataNode[] {
  const byType = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})
  return Object.entries(byType).map(([type, items]) => ({
    key: type,
    title: TYPE_LABELS[type as Resource['type']] || type,
    children: items.map((r) => ({
      key: r.id,
      title: `${r.name} — ${r.quantity} ${r.unit}`,
    })),
  }))
}

interface RBSTreeProps {
  resources: Resource[]
}

export function RBSTree({ resources }: RBSTreeProps) {
  const treeData = groupByType(resources)
  return <Tree showLine treeData={treeData} defaultExpandAll />
}
