import { defineStore } from 'pinia'
import axios from 'axios'

export type AdminRole = 'admin' | 'staff'

export interface AdminUser {
  id: number
  email: string
  role: AdminRole
  department?: string | null
}

const backend = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000') as string

export const useAdminUserStore = defineStore('adminUsers', {
  state: () => ({
    users: [] as AdminUser[],
    loading: false as boolean,
    error: '' as string,
  }),
  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = ''
      try {
        // Expected backend endpoint: GET /admin/users → { users: AdminUser[] }
        const { data } = await axios.get(`${backend}/admin/users`)
        this.users = Array.isArray(data?.users) ? data.users : []
      } catch {
        // Fallback mock so UI is usable without backend ready
        this.users = [
          { id: 1, email: 'ABC@cmu.ac.th', role: 'admin', department: 'Financial Department' },
          { id: 2, email: 'DEF@cmu.ac.th', role: 'staff', department: 'Faculty of Engineering' },
        ]
      } finally {
        this.loading = false
      }
    },

    async assignUser(email: string, role: AdminRole, department?: string) {
      try {
        const payload = { email, role, department }
        // Expected backend endpoint: POST /admin/users
        await axios.post(`${backend}/admin/users`, payload)
        await this.fetchUsers()
      } catch {
        // Optimistic local insert for demo
        const nextId = (this.users.at(-1)?.id || 0) + 1
        this.users.push({ id: nextId, email, role, department: department || null })
      }
    },

    async changeRole(userId: number, role: AdminRole) {
      try {
        // Expected backend endpoint: PATCH /admin/users/:id/role
        // Attach actor_id from current session so backend can audit/notify with changed_by
        let actorId: number | undefined
        try {
          const raw = sessionStorage.getItem('user_info')
          if (raw) {
            const u = JSON.parse(raw)
            if (typeof u?.user_id === 'number') actorId = u.user_id
          }
        } catch {}
        await axios.patch(`${backend}/admin/users/${userId}/role`, { role, actor_id: actorId })
        const u = this.users.find(u => u.id === userId)
        if (u) u.role = role
      } catch {
        const u = this.users.find(u => u.id === userId)
        if (u) u.role = role
      }
    },

    async deleteUser(userId: number) {
      try {
        // Expected backend endpoint: DELETE /admin/users/:id
        await axios.delete(`${backend}/admin/users/${userId}`)
        this.users = this.users.filter(u => u.id !== userId)
      } catch {
        this.users = this.users.filter(u => u.id !== userId)
      }
    },
  },
})


