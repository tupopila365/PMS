import { Tree, Tag } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { Task } from '../../types'

function buildTree(tasks: Task[], parentId?: string): DataNode[] {
  return tasks
    .filter((t) => (parentId ? t.parentId === parentId : !t.parentId))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((t) => ({
      key: t.id,
      title: (
        <span>
          {t.title}
          {t.isMilestone && <Tag color="blue" style={{ marginLeft: 8 }}>Milestone</Tag>}
          {t.status === 'completed' && ' ✓'}
        </span>
      ),
      children: buildTree(tasks, t.id),
    }))
}

interface WBSTreeProps {
  tasks: Task[]
}

export function WBSTree({ tasks }: WBSTreeProps) {
  const treeData = buildTree(tasks)
  return <Tree showLine treeData={treeData} defaultExpandAll /> 
}
