import { defineStore } from 'pinia'
import extractKeyAPI from '@/service/ExtractKey'

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
      const results = await Promise.all(
        this.taskIds.map(async (taskId) => {
          // DB-backed staged item
          if (taskId.startsWith('file:')) {
            return this.byId[taskId] || null
          }
          // Memory task
          try {
            const res = await extractKeyAPI.getStatus(taskId)
            if (res.data.status === 'complete') {
              const name = res.data.display_name || res.data.filename
              const obj = { ...res.data, task_id: taskId, filename: name }
              this.byId[taskId] = obj
              return obj
            }
          } catch {}
          return null
        })
      )
      this.completedTasks = results.filter(Boolean)
    },
    async hydrateFromBackend() {
      try {
        // filter by current user if available
        let params: any = {}
        try {
          const raw = sessionStorage.getItem('user_info')
          if (raw) {
            const u = JSON.parse(raw)
            if (typeof u?.user_id === 'number') params.user_id = u.user_id
            else if (u?.email) params.email = u.email
          }
        } catch {}
        const res = await extractKeyAPI.getTaskBoard(params)
        const data = Array.isArray(res.data?.data) ? res.data.data : []
        for (const item of data) {
          if (item?.task_id) this.addTaskId(String(item.task_id))
          if (item?.task_id) this.byId[String(item.task_id)] = item
        }
        // Optionally keep a mirror list for UI that expects results shape
        // Here we just map minimal fields
        this.completedTasks = data
      } catch {
        // ignore hydration errors
      }
    },
    removeTask(taskId: string) {
      this.completedTasks = this.completedTasks.filter(t => t.task_id !== taskId)
      this.taskIds = this.taskIds.filter(id => id !== taskId)
    }
  }
})
