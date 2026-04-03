export function exportProjectsToCSV(projects: { name: string; type: string; region?: string; client?: string; status?: string; budget?: number; actualCost?: number }[]) {
  const headers = ['Name', 'Type', 'Region', 'Client', 'Status', 'Estimated cost', 'Actual cost']
  const rows = projects.map((p) => [
    p.name,
    p.type,
    p.region || '',
    p.client || '',
    p.status || '',
    p.budget?.toString() || '',
    p.actualCost?.toString() || '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `portfolio-projects-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
