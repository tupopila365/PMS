import { Spin } from 'antd'

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[280px] w-full text-[var(--text-secondary)]">
      <Spin size="large" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}
