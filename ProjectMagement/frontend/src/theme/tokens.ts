/**
 * Design tokens for the CBMP design system.
 */
export const tokens = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#3b82f6',
    primaryActive: '#1d4ed8',
    primaryLight: 'rgba(37, 99, 235, 0.12)',
    success: '#16a34a',
    successLight: 'rgba(22, 163, 74, 0.12)',
    warning: '#ea580c',
    warningLight: 'rgba(234, 88, 12, 0.12)',
    danger: '#dc2626',
    dangerLight: 'rgba(220, 38, 38, 0.12)',
    light: {
      pageBg: '#fafafa',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      surfaceMuted: '#f8fafc',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      borderMuted: '#f1f5f9',
    },
    dark: {
      pageBg: '#0f0f0f',
      surface: '#1a1a1a',
      surfaceElevated: '#262626',
      surfaceMuted: '#171717',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      border: '#334155',
      borderMuted: '#1e293b',
    },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { sm: 8, md: 12, lg: 16 },
  typography: {
    fontHeading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontBody: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.06)',
  },
} as const

export type ThemeMode = 'light' | 'dark'
