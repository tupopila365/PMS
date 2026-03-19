import { Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { CostCategory } from '../../types'

function buildTree(categories: CostCategory[], parentId?: string): DataNode[] {
  return categories
    .filter((c) => (parentId ? c.parentId === parentId : !c.parentId))
    .map((c) => ({
      key: c.id,
      title: `${c.name} — Budget: $${c.budget.toLocaleString()} | Actual: $${c.actualCost.toLocaleString()}`,
      children: buildTree(categories, c.id),
    }))
}

interface CBSTreeProps {
  categories: CostCategory[]
}

export function CBSTree({ categories }: CBSTreeProps) {
  const treeData = buildTree(categories)
  return <Tree showLine treeData={treeData} defaultExpandAll />
}
