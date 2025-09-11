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
          } catch (err) {
            console.error('fetchCompletedTasks getStatus error', taskId, err)
          }
          return null
        })
      )
      this.completedTasks = results.filter(Boolean)
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

          // ให้ task_id ของ DB task เป็น "file:<id>"
          const taskId = String(item.task_id).startsWith('file:') ? String(item.task_id) : `file:${item.task_id}`

          this.addTaskId(taskId)
          this.byId[taskId] = { ...item, task_id: taskId }
        }

        // Merge DB tasks กับ existing completedTasks (memory tasks)
        const mergedTasks = [
          ...this.completedTasks.filter(t => !t.task_id.startsWith('file:')), // memory tasks
          ...Object.values(this.byId).filter(t => t.task_id.startsWith('file:')) // DB tasks
        ]

        this.completedTasks = mergedTasks

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
