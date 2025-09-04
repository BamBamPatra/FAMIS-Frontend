import { defineStore } from 'pinia'
import extractKeyAPI from '@/service/ExtractKey'

export const useTaskBoardStore = defineStore('taskBoard', {
  state: () => ({
    taskIds: [] as string[],
    completedTasks: [] as any[]
  }),
  actions: {
    addTaskId(taskId: string) {
      if (!this.taskIds.includes(taskId)) {
        this.taskIds.push(taskId)
      }
    },
    async fetchCompletedTasks() {
      const results = await Promise.all(
        this.taskIds.map(taskId =>
          extractKeyAPI.getStatus(taskId).then(res => {
            if (res.data.status === 'complete') {
              return { ...res.data, task_id: taskId }
            }
          }).catch(() => null)
        )
      )
      this.completedTasks = results.filter(Boolean)
    },
    async hydrateFromBackend() {
      try {
        const res = await extractKeyAPI.getTaskBoard()
        const data = Array.isArray(res.data?.data) ? res.data.data : []
        for (const item of data) {
          if (item?.task_id) this.addTaskId(String(item.task_id))
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
