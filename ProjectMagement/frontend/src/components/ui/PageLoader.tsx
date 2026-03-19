import { Spin } from 'antd'

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[280px] w-full">
      <Spin size="large" />
    </div>
  )
}
