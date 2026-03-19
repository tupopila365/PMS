import type { ThemeConfig } from 'antd'
import { theme } from 'antd'
import { tokens } from './tokens'

export function getAntdTheme(isDark: boolean): ThemeConfig {
  const colors = isDark ? tokens.colors.dark : tokens.colors.light
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: tokens.colors.primary,
      colorPrimaryHover: tokens.colors.primaryHover,
      colorPrimaryActive: tokens.colors.primaryActive,
      colorSuccess: tokens.colors.success,
      colorWarning: tokens.colors.warning,
      colorError: tokens.colors.danger,
      colorBgContainer: colors.surface,
      colorBgLayout: colors.pageBg,
      colorText: colors.textPrimary,
      colorTextSecondary: colors.textSecondary,
      colorBorder: colors.border,
      borderRadius: tokens.radius.sm,
      fontFamily: tokens.typography.fontBody,
    },
    components: {
      Card: { borderRadiusLG: tokens.radius.md, boxShadow: tokens.shadows.sm },
      Button: { borderRadius: tokens.radius.sm },
      Input: { activeBorderColor: tokens.colors.primary, hoverBorderColor: tokens.colors.primaryHover },
      Table: { headerBg: colors.surfaceMuted, headerColor: colors.textPrimary },
    },
  }
}
