import { api } from './api'
import { projectService } from './projectService'
import { taskService } from './taskService'
import { costService } from './costService'
import type { ProjectTemplate, Project, ProjectType } from '../types'

export const templateService = {
  async getTemplates(projectType?: ProjectType): Promise<ProjectTemplate[]> {
    const params = projectType ? { projectType } : {}
    const { data } = await api.get<ProjectTemplate[]>('/templates', { params })
    return data
  },

  async getTemplate(id: string): Promise<ProjectTemplate | undefined> {
    const { data } = await api.get<ProjectTemplate>(`/templates/${id}`)
    return data
  },

  /**
   * Create a project from a template, including WBS tasks and CBS categories.
   * Allocates budget proportionally to CBS categories if total budget provided.
   */
  async createProjectFromTemplate(
    templateId: string,
    projectData: Omit<Project, 'id'> & { budget?: number }
  ): Promise<Project> {
    const template = await this.getTemplate(templateId)
    if (!template) throw new Error('Template not found')

    const project = await projectService.createProject({
      ...projectData,
      type: template.projectType,
    })

    const tempIdToTaskId: Record<string, string> = {}
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + 1)

    for (const t of template.wbsTasks.sort((a, b) => a.order - b.order)) {
      const startDate = new Date(baseDate)
      const duration = t.duration ?? 7
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + duration)

      const task = await taskService.createTask({
        projectId: project.id,
        title: t.title,
        status: 'not_started',
        duration: t.duration,
        isMilestone: t.isMilestone,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        dueDate: endDate.toISOString().slice(0, 10),
        predecessors: t.predecessorTempIds?.map((pid) => tempIdToTaskId[pid]).filter(Boolean),
        order: t.order,
      })
      tempIdToTaskId[t.tempId] = task.id
      baseDate.setDate(baseDate.getDate() + duration + 1)
    }

    const totalBudget = projectData.budget ?? 0
    const catCount = template.cbsCategories.length
    const budgetPerCat = catCount > 0 ? Math.floor(totalBudget / catCount) : 0

    for (const c of template.cbsCategories) {
      await costService.createCategory({
        projectId: project.id,
        name: c.name,
        budget: totalBudget > 0 ? budgetPerCat : c.budget,
        actualCost: 0,
      })
    }

    return project
  },
}
