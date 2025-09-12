import { defineStore } from 'pinia'
import extractKeyAPI from '@/service/ExtractKey'

function normalizeTask(item: any) {
  const taskId = item.task_id ? String(item.task_id) : null
  if (!taskId) return null

  return {
    task_id: taskId,
    file_id: item.file_id ?? null,
    filename: item.filename || '',
    display_name: item.display_name || item.filename || '',
    timestamp: item.timestamp || new Date().toISOString(),
    status: item.status || 'complete',
    message: item.message || '',
    file_base64: item.file_base64 || null,
    result: item.result || [],
    ...item
  }
}

export const useTaskBoardStore = defineStore('taskBoard', {
  state: () => ({
    taskIds: [] as string[],
    completedTasks: [] as any[],
    byId: {} as Record<string, any>
  }),
  actions: {
    addTaskId(taskId: string) {
      if (!this.taskIds.includes(taskId)) {
        this.taskIds.push(taskId)
      }
    },

    async fetchCompletedTasks() {
      const dbTasks = Object.values(this.byId).filter((t: any) =>
        String(t.task_id).startsWith('file:')
      )

      const memoryIds = this.taskIds.filter(id => !id.startsWith('file:'))
      const memoryResults = await Promise.all(
        memoryIds.map(async (taskId) => {
          try {
            const res = await extractKeyAPI.getStatus(taskId)
            if (res.data.status === 'complete') {
              const obj = normalizeTask({ ...res.data, task_id: taskId })
              if (obj) this.byId[taskId] = obj
              return obj
            }
          } catch (err) {
            console.error('fetchCompletedTasks getStatus error', taskId, err)
          }
          return null
        })
      )

      const memTasks = memoryResults.filter(Boolean) as any[]

      const seen = new Set<string>()
      const merged = [...dbTasks, ...memTasks].filter((t: any) => {
        if (seen.has(t.task_id)) return false
        seen.add(t.task_id)
        return true
      })

      this.completedTasks = merged
    },

    async hydrateFromBackend() {
      try {
        let params: any = {}
        try {
          const raw = sessionStorage.getItem('user_info')
          if (raw) {
            const u = JSON.parse(raw)
            if (typeof u?.user_id === 'number') params.user_id = u.user_id
            else if (u?.email) params.email = u.email
          }
        } catch (err) {
          console.warn('Failed to parse user_info', err)
        }

        console.log('Hydrate TaskBoard params:', params)
        const res = await extractKeyAPI.getTaskBoard(params)
        console.log('TaskBoard API response:', res.data)

        const data = Array.isArray(res.data?.data) ? res.data.data : []

        for (const rawItem of data) {
          const item = normalizeTask(rawItem)
          if (!item) continue

          const taskId = item.task_id
          if (!this.taskIds.includes(taskId)) this.taskIds.push(taskId)
          this.byId[taskId] = item
        }


        const dbTasks = Object.values(this.byId).filter((t: any) =>
          String(t.task_id).startsWith('file:')
        )
        const memoryTasks = this.completedTasks.filter((t: any) =>
          !String(t.task_id).startsWith('file:')
        )

        const seen = new Set<string>()
        const merged = [...memoryTasks, ...dbTasks].filter((t: any) => {
          if (seen.has(t.task_id)) return false
          seen.add(t.task_id)
          return true
        })

        this.completedTasks = merged

        console.log('Completed tasks after hydrate:', this.completedTasks)
      } catch (err) {
        console.error('hydrateFromBackend error', err)
      }
    },

    removeTask(taskId: string) {
      this.completedTasks = this.completedTasks.filter(t => t.task_id !== taskId)
      this.taskIds = this.taskIds.filter(id => id !== taskId)
      delete this.byId[taskId]
    }
  }
})
