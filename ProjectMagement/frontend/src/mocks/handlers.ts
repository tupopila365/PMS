import { http, HttpResponse } from 'msw'
import { mockUsers, mockProjects, mockTasks, mockInvoices, mockPayments, mockImages, mockKPIs } from './data'

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    const user = mockUsers.find((u) => u.email === body.email)
    if (user && body.password === 'password') {
      return HttpResponse.json({
        token: 'mock-jwt-token-' + user.id,
        user,
      })
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer mock-jwt-token-')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const userId = auth.replace('Bearer mock-jwt-token-', '')
    const user = mockUsers.find((u) => u.id === userId)
    if (!user) return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    return HttpResponse.json(user)
  }),

  http.get('/api/projects', () => HttpResponse.json(mockProjects)),
  http.get('/api/projects/:id', ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id)
    if (!project) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(project)
  }),

  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    const tasks = projectId ? mockTasks.filter((t) => t.projectId === projectId) : mockTasks
    return HttpResponse.json(tasks)
  }),
  http.put('/api/tasks/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<{ status: string }>
    const task = mockTasks.find((t) => t.id === params.id)
    if (!task) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json({ ...task, ...body })
  }),

  http.get('/api/images', ({ request }) => {
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    const images = projectId ? mockImages.filter((i) => i.projectId === projectId) : mockImages
    return HttpResponse.json(images)
  }),

  http.post('/api/images/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const newImage = {
      id: 'mock-' + Date.now(),
      projectId,
      companyId: '1',
      filePath: `/storage/company_1/project_${projectId}/images/${file?.name || 'upload.jpg'}`,
      latitude: 40.7128,
      longitude: -74.006,
      timestamp: new Date().toISOString(),
      fileName: file?.name || 'upload.jpg',
    }
    return HttpResponse.json(newImage)
  }),

  http.get('/api/invoices', () => HttpResponse.json(mockInvoices)),
  http.get('/api/payments', () => HttpResponse.json(mockPayments)),

  http.get('/api/dashboard/kpis', () => HttpResponse.json(mockKPIs)),
]
