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
      borderRadius: 0,
      fontFamily: tokens.typography.fontBody,
    },
    components: {
      Card: {
        borderRadiusLG: 0,
        borderRadius: 0,
        boxShadow: isDark ? '0 1px 2px rgba(0, 0, 0, 0.35)' : tokens.shadows.sm,
        headerBg: colors.surfaceMuted,
      },
      Button: { borderRadius: 0 },
      Modal: { borderRadiusLG: 0 },
      Drawer: { borderRadiusLG: 0 },
      Input: { borderRadius: 0, activeBorderColor: tokens.colors.primary, hoverBorderColor: tokens.colors.primaryHover },
      Select: {
        borderRadius: 0,
        colorBgElevated: colors.surfaceElevated,
        optionSelectedBg: colors.surfaceMuted,
        optionActiveBg: colors.surfaceMuted,
      },
      Table: { headerBg: colors.surfaceMuted, headerColor: colors.textPrimary },
      Tabs: { borderRadius: 0 },
      DatePicker: { borderRadius: 0 },
      Collapse: { borderRadiusLG: 0 },
      Tag: { borderRadiusSM: 0 },
      Alert: { borderRadiusLG: 0 },
      Menu: { itemBorderRadius: 0, subMenuItemBorderRadius: 0, groupTitleBorderRadius: 0 },
      Segmented: { borderRadius: 0, trackPadding: 2 },
    },
  }
}
