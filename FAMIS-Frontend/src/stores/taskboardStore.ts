import { defineStore } from 'pinia'
import extractKeyAPI from '@/service/ExtractKey'
import { useAuthStore } from '@/stores/authStore'

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
    byId: {} as Record<string, any>,
    ownerKey: null as string | null,
    pendingCount: 0 as number,
  }),
  actions: {
    addTaskId(taskId: string) {
      if (!this.taskIds.includes(taskId)) {
        this.taskIds.push(taskId)
      }
    },

    reset() {
      this.taskIds = []
      this.completedTasks = []
      this.byId = {}
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

      // Prefer memory tasks (richer data) and dedupe by file_id first, then by task_id
      const seenFileIds = new Set<number>()
      const seenTaskIds = new Set<string>()

      const memoryFirst = [...memTasks]
      const dedupedDb = dbTasks.filter((t: any) => {
        const fid = typeof t.file_id === 'number' ? t.file_id : (t.file_id ? Number(t.file_id) : NaN)
        if (!Number.isNaN(fid)) {
          if (seenFileIds.has(fid)) return false
          // If any memory task has same file_id, skip this db row
          const hasInMemory = memTasks.some((m: any) => Number(m.file_id) === fid)
          if (hasInMemory) return false
        }
        return true
      })

      for (const m of memoryFirst) {
        const fid = typeof m.file_id === 'number' ? m.file_id : (m.file_id ? Number(m.file_id) : NaN)
        if (!Number.isNaN(fid)) seenFileIds.add(fid)
        seenTaskIds.add(String(m.task_id))
      }

      const merged = [...memoryFirst]
      for (const d of dedupedDb) {
        const tid = String(d.task_id)
        if (seenTaskIds.has(tid)) continue
        const fid = typeof d.file_id === 'number' ? d.file_id : (d.file_id ? Number(d.file_id) : NaN)
        if (!Number.isNaN(fid) && seenFileIds.has(fid)) continue
        merged.push(d)
        if (!Number.isNaN(fid)) seenFileIds.add(fid)
        seenTaskIds.add(tid)
      }

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

        // Fallback to auth store if session storage is missing
        if (!params.user_id && !params.email) {
          try {
            const auth = useAuthStore()
            const u = auth.userInfo as any
            if (u) {
              if (typeof u.user_id === 'number') params.user_id = u.user_id
              else if (u.email) params.email = u.email
            }
          } catch (e) {
            console.warn('Auth store not available for hydrate fallback', e)
          }
        }

        const newOwnerKey = params.user_id ? `id:${params.user_id}` : (params.email ? `email:${String(params.email).toLowerCase()}` : null)
        if (newOwnerKey && newOwnerKey !== this.ownerKey) {
          this.reset()
          this.ownerKey = newOwnerKey
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


        const dbTasks = Object.values(this.byId).filter((t: any) => String(t.task_id).startsWith('file:'))
        const memoryTasks = this.completedTasks.filter((t: any) => !String(t.task_id).startsWith('file:'))

        // Prefer memory tasks, dedupe by file_id if present
        const seenFileIds = new Set<number>()
        const seenTaskIds = new Set<string>()
        for (const m of memoryTasks) {
          const fid = typeof m.file_id === 'number' ? m.file_id : (m.file_id ? Number(m.file_id) : NaN)
          if (!Number.isNaN(fid)) seenFileIds.add(fid)
          seenTaskIds.add(String(m.task_id))
        }
        const merged = [...memoryTasks]
        for (const d of dbTasks) {
          const tid = String(d.task_id)
          if (seenTaskIds.has(tid)) continue
          const fid = typeof d.file_id === 'number' ? d.file_id : (d.file_id ? Number(d.file_id) : NaN)
          if (!Number.isNaN(fid) && seenFileIds.has(fid)) continue
          merged.push(d)
          if (!Number.isNaN(fid)) seenFileIds.add(fid)
          seenTaskIds.add(tid)
        }

        this.completedTasks = merged

        console.log('Completed tasks after hydrate:', this.completedTasks)

        // Also fetch count for debugging/UX badge
        try {
          const cntRes = await extractKeyAPI.getTaskBoardCount(params)
          const c = Number((cntRes.data && cntRes.data.count) ?? 0)
          this.pendingCount = Number.isFinite(c) ? c : 0
          console.log('Pending count:', this.pendingCount)
        } catch (e) {
          console.warn('getTaskBoardCount failed', e)
        }
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
