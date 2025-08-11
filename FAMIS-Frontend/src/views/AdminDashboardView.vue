<template>
  <div class="content">
      <div class="toolbar">
        <button class="assign-btn" @click="openAssign">+ ASSIGN EMAIL</button>
      </div>

      <div class="table">
        <div class="thead">
          <div class="th">Role</div>
          <div class="th">Mail</div>
          <div class="th">Department</div>
          <div class="th actions">Actions</div>
        </div>
        <div class="row" v-for="u in users" :key="u.id">
          <div class="cell cap">{{ u.role }}</div>
          <div class="cell">{{ u.email }}</div>
          <div class="cell">{{ u.department || '-' }}</div>
          <div class="cell actions">
            <button title="Change role" class="icon" @click="openChange(u)">⟳</button>
            <button title="Delete" class="icon danger" @click="openDelete(u)">🗑</button>
          </div>
        </div>
      </div>

      <!-- Assign Modal -->
      <div v-if="showAssign" class="modal">
        <div class="dialog">
          <h2>Assign Email</h2>
          <label>CMU E-Mail</label>
          <input v-model.trim="assignEmail" type="email" placeholder="name@cmu.ac.th" />

          <label>Role</label>
          <select v-model="assignRole">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          <div class="actions-row">
            <button class="ghost" @click="closeAssign">CANCEL</button>
            <button class="primary" @click="confirmAssign" :disabled="!assignEmail">CONFIRM</button>
          </div>
        </div>
      </div>

      <!-- Change Role Modal -->
      <div v-if="showChange" class="modal">
        <div class="dialog">
          <h2>Change role</h2>
          <div class="sub">{{ selectedUser?.email }}</div>
          <label>Choose role</label>
          <select v-model="changeRole">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          <div class="actions-row">
            <button class="ghost" @click="closeChange">CANCEL</button>
            <button class="primary" @click="confirmChange" :disabled="!selectedUser">CONFIRM</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div v-if="showDelete" class="modal">
        <div class="dialog">
          <h2 class="warn">!! WARNING !!</h2>
          <p>Confirm to delete {{ selectedUser?.email }} account</p>
          <div class="actions-row">
            <button class="ghost" @click="closeDelete">CANCEL</button>
            <button class="danger" @click="confirmDelete" :disabled="!selectedUser">CONFIRM</button>
          </div>
        </div>
      </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAdminUserStore, type AdminUser, type AdminRole } from '@/stores/adminUserStore'
import { useAuthStore } from '@/stores/authStore'

const adminStore = useAdminUserStore()
const auth = useAuthStore()

const users = computed(() => adminStore.users)
const currentEmail = computed(() => auth.userInfo?.email || 'user@cmu.ac.th')

const showAssign = ref(false)
const assignEmail = ref('')
const assignRole = ref<AdminRole>('staff')

const showChange = ref(false)
const selectedUser = ref<AdminUser | null>(null)
const changeRole = ref<AdminRole>('staff')

const showDelete = ref(false)

const openAssign = () => { showAssign.value = true }
const closeAssign = () => { showAssign.value = false; assignEmail.value=''; assignRole.value='staff' }
const confirmAssign = async () => {
  await adminStore.assignUser(assignEmail.value, assignRole.value)
  closeAssign()
}

const openChange = (u: AdminUser) => { selectedUser.value = u; changeRole.value = u.role; showChange.value = true }
const closeChange = () => { showChange.value = false; selectedUser.value = null }
const confirmChange = async () => {
  if (!selectedUser.value) return
  await adminStore.changeRole(selectedUser.value.id, changeRole.value)
  closeChange()
}

const openDelete = (u: AdminUser) => { selectedUser.value = u; showDelete.value = true }
const closeDelete = () => { showDelete.value = false; selectedUser.value = null }
const confirmDelete = async () => {
  if (!selectedUser.value) return
  await adminStore.deleteUser(selectedUser.value.id)
  closeDelete()
}

onMounted(() => {
  adminStore.fetchUsers()
})
</script>

<style scoped>
.content { padding: 24px; }
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.assign-btn { background: #e5e7eb; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }

.table { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.thead, .row { display: grid; grid-template-columns: 160px 1fr 1fr 160px; align-items: center; }
.thead { background: #f8fafc; font-weight: 600; }
.th, .cell { padding: 12px 16px; border-bottom: 1px solid #eef2f7; }
.cell.cap { text-transform: capitalize; }
.actions { display: flex; gap: 8px; align-items: center; }
.icon { background: #eef2ff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.icon.danger { background: #fee2e2; }

.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; }
.dialog { background: #fff; min-width: 420px; border-radius: 12px; padding: 24px; display:flex; flex-direction: column; gap: 12px; }
.dialog h2 { margin: 0; text-align: center; }
.dialog .sub { text-align: center; color: #6b7280; }
.dialog input, .dialog select { padding: 10px 12px; border:1px solid #e5e7eb; border-radius: 8px; }
.actions-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.ghost { background: #e5e7eb; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.primary { background: #a78bfa; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.danger { background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.warn { color: #ef4444; text-align:center; }
</style>


