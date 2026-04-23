/**
 * Ant Design Select does not treat `undefined` as a reliable option `value`.
 * Use this string for the "All projects" row and map it to `undefined` for API / context.
 */
export const ALL_PROJECTS_SELECT_VALUE = ''

export function projectIdFromSelect(v: string | number | null | undefined): string | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'number') return String(v)
  return v
}

export function selectValueFromProjectId(projectId: string | undefined): string {
  return projectId ?? ALL_PROJECTS_SELECT_VALUE
}
