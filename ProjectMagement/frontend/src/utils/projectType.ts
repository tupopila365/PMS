/** Suggested project types (users may enter any string). */
export const PROJECT_TYPE_PRESET_OPTIONS: { value: string; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'roads', label: 'Roads' },
  { value: 'railway', label: 'Railway' },
  { value: 'buildings', label: 'Buildings' },
]

const KNOWN_LABELS: Record<string, string> = {
  construction: 'Construction',
  roads: 'Roads',
  railway: 'Railway',
  buildings: 'Buildings',
}

/** Display label for list/detail/charts; title-cases custom types. */
export function formatProjectTypeLabel(type: string): string {
  const t = type?.trim()
  if (!t) return '—'
  if (KNOWN_LABELS[t]) return KNOWN_LABELS[t]
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const TAG_PRESET_COLORS: Record<string, string> = {
  construction: 'blue',
  roads: 'green',
  railway: 'orange',
  buildings: 'purple',
}

/** Ant Design Tag color for a project type (stable color for unknown types). */
export function tagColorForProjectType(type: string): string {
  if (TAG_PRESET_COLORS[type]) return TAG_PRESET_COLORS[type]
  const palette = ['geekblue', 'cyan', 'magenta', 'gold', 'lime', 'volcano'] as const
  let h = 0
  for (let i = 0; i < type.length; i++) h = (h + type.charCodeAt(i) * (i + 1)) % 997
  return palette[Math.abs(h) % palette.length]
}

const CHART_HEX_PRESET: Record<string, string> = {
  construction: '#52c41a',
  roads: '#13c2c2',
  railway: '#1890ff',
  buildings: '#fa8c16',
}

const CHART_HEX_FALLBACK = ['#722ed1', '#eb2f96', '#faad14', '#a0d911', '#cf1322'] as const

/** Progress / chart stroke color for a type. */
export function chartColorForProjectType(type: string): string {
  if (CHART_HEX_PRESET[type]) return CHART_HEX_PRESET[type]
  let h = 0
  for (let i = 0; i < type.length; i++) h = (h + type.charCodeAt(i) * (i + 1)) % 997
  return CHART_HEX_FALLBACK[Math.abs(h) % CHART_HEX_FALLBACK.length]
}
