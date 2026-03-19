import { ConfigProvider } from 'antd'
import { getAntdTheme } from './antdTheme'
import { useTheme } from './ThemeContext'

export function ThemeConfig({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  return <ConfigProvider theme={getAntdTheme(isDark)}>{children}</ConfigProvider>
}
