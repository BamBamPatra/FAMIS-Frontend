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
      // Keep DB-backed tasks as-is from byId
      const dbTasks = Object.values(this.byId).filter((t: any) => String(t.task_id).startsWith('file:'))

      // Fetch memory tasks only
      const memoryIds = this.taskIds.filter(id => !id.startsWith('file:'))
      const memoryResults = await Promise.all(
        memoryIds.map(async (taskId) => {
          try {
            const res = await extractKeyAPI.getStatus(taskId)
            if (res.data.status === 'complete') {
              const name = res.data.display_name || res.data.filename
              const obj = { ...res.data, task_id: taskId, filename: name }
              this.byId[taskId] = obj
              return obj
            }
          } catch (err) {
            console.error('fetchCompletedTasks getStatus error', taskId, err)
          }
          return null
        })
      )

      const memTasks = memoryResults.filter(Boolean) as any[]

      // Merge and de-dup
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

        for (const item of data) {
          if (!item?.task_id) continue

          // DB task must be formatted as file:<id> already from backend
          const taskId = String(item.task_id)

          // avoid duplicates
          if (!this.taskIds.includes(taskId)) this.taskIds.push(taskId)
          this.byId[taskId] = { ...item, task_id: taskId }
        }

        // Merge DB tasks with existing completedTasks (memory tasks)
        const dbTasks = Object.values(this.byId).filter((t: any) => String(t.task_id).startsWith('file:'))
        const memoryTasks = this.completedTasks.filter((t: any) => !String(t.task_id).startsWith('file:'))

        // Ensure no duplicate task_ids
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
