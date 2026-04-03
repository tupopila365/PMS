/**
 * Design tokens for the CBMP design system.
 */
export const tokens = {
  colors: {
    /** Soft yellow-gold on cool grey — high contrast without harsh neon. */
    primary: '#ca8a04',
    primaryHover: '#a16207',
    primaryActive: '#854d0e',
    primaryLight: 'rgba(202, 138, 4, 0.16)',
    success: '#15803d',
    successLight: 'rgba(21, 128, 61, 0.12)',
    warning: '#ca8a04',
    warningLight: 'rgba(202, 138, 4, 0.14)',
    danger: '#b91c1c',
    dangerLight: 'rgba(185, 28, 28, 0.12)',
    light: {
      pageBg: '#eceef0',
      surface: '#f6f7f8',
      surfaceElevated: '#ffffff',
      surfaceMuted: '#e8eaed',
      textPrimary: '#1f2937',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      border: '#d1d5db',
      borderMuted: '#e5e7eb',
    },
    dark: {
      pageBg: '#18181b',
      surface: '#1f1f23',
      surfaceElevated: '#27272a',
      surfaceMuted: '#2a2a2e',
      textPrimary: '#f4f4f5',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      border: '#3f3f46',
      borderMuted: '#27272a',
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
