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
      colorBgElevated: colors.surfaceElevated,
      colorBgLayout: colors.pageBg,
      colorText: colors.textPrimary,
      colorTextSecondary: colors.textSecondary,
      colorBorder: colors.border,
      borderRadius: tokens.radius.sm,
      fontFamily: tokens.typography.fontBody,
    },
    components: {
      Card: {
        borderRadiusLG: tokens.radius.md,
        boxShadow: isDark ? '0 1px 2px rgba(0, 0, 0, 0.35)' : tokens.shadows.sm,
        headerBg: colors.surfaceMuted,
      },
      Button: { borderRadius: tokens.radius.sm },
      Input: { activeBorderColor: tokens.colors.primary, hoverBorderColor: tokens.colors.primaryHover },
      Select: {
        colorBgElevated: colors.surfaceElevated,
        optionSelectedBg: colors.surfaceMuted,
        optionActiveBg: colors.surfaceMuted,
      },
      Table: { headerBg: colors.surfaceMuted, headerColor: colors.textPrimary },
    },
  }
}
