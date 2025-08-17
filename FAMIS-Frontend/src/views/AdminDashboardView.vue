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

<template>
  <div class="content">
      <!-- Add new user -->
      <div class="toolbar">
        <button class="assign-btn" @click="openAssign">+ ADD NEW USER</button>
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

            <!-- Change role user icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 640 640" @click="openChange(u)">
               <path d="M467.8 98.4C479.8 93.4 493.5 96.2 502.7 105.3L566.7 169.3C572.7 175.3 576.1 183.4 576.1 191.9C576.1 200.4 572.7 208.5 566.7 214.5L502.7 278.5C493.5 287.7 479.8 290.4 467.8 285.4C455.8 280.4 448 268.9 448 256L448 224L416 224C405.9 224 396.4 228.7 390.4 236.8L358 280L318 226.7L339.2 198.4C357.3 174.2 385.8 160 416 160L448 160L448 128C448 115.1 455.8 103.4 467.8 98.4zM218 360L258 413.3L236.8 441.6C218.7 465.8 190.2 480 160 480L96 480C78.3 480 64 465.7 64 448C64 430.3 78.3 416 96 416L160 416C170.1 416 179.6 411.3 185.6 403.2L218 360zM502.6 534.6C493.4 543.8 479.7 546.5 467.7 541.5C455.7 536.5 448 524.9 448 512L448 480L416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5z"/>
            </svg>

            <!-- Delete user icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 640 640" @click="openDelete(u)">
               <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
            </svg>

          </div>
        </div>
      </div>

      <!-- Add new user -->
      <div v-if="showAssign" class="modal">
        <div class="dialog">
          <h2>ADD NEW USER</h2>
          <label>CMU E-Mail</label>
          <input v-model.trim="assignEmail" type="email" placeholder="name@cmu.ac.th" />

          <label>Role</label>
          <select v-model="assignRole">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          <div class="actions-row" >
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
          <select v-model="changeRole" >
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

<style scoped>
.content { 
  padding: 24px; 
}

.toolbar { 
  display: flex; 
  justify-content: flex-end; 
  margin-bottom: 16px; 
}

.assign-btn { 
  background: #e5e7eb; 
  border: none; 
  padding: 8px 12px; 
  border-radius: 6px; 
  cursor: pointer; 
  transition: fill 0.3s; 
}

.assign-btn:hover {
  background: #9B7EBD; 
  color: white;
}

.table { 
  border: 1px solid #e5e7eb; 
  border-radius: 8px; 
  overflow: hidden; 
}

.thead, .row { 
  display: grid; 
  grid-template-columns: 160px 1fr 1fr 160px; 
  align-items: center; 
}

.thead { 
  background: #f8fafc; 
  font-weight: 600; 
}

.th, .cell { 
  padding: 12px 16px; 
  border-bottom: 1px solid #eef2f7; 
}

.cell.cap { 
  text-transform: capitalize; 
}

.actions { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
}

.icon {
  width: 30px;
  cursor: pointer;
  transition: fill 0.3s; 
  fill: #000000; 
  padding-right: 10px;
}

.icon:hover {
  fill: #8568a6; 
}

.modal { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.5); 
  display:flex; 
  align-items:center; 
  justify-content:center; 
}

.dialog { 
  background: #fff;
  min-width: 420px; 
  border-radius: 12px; 
  padding: 24px; 
  display:flex; 
  flex-direction: column;
  gap: 8px; 
}

.dialog h2 { 
  margin: 0; 
  text-align: center; 
}

.dialog .sub { 
  text-align: center; 
  color: #6b7280; 
}

.dialog input{ 
  padding: 10px 12px; 
  border:1px solid #e5e7eb; 
  border-radius: 8px; 
}

.dialog select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.actions-row { 
  display: flex; 
  justify-content: flex-end; 
  gap: 8px; 
  margin-top: 8px; 
}

.ghost { 
  background: #e5e7eb; 
  border: none; 
  padding: 8px 12px; 
  border-radius: 8px; 
  cursor: pointer; 
}

.ghost:hover {
  background: #ef4444;
  color: white;
}

.primary { 
  background: #9B7EBD; 
  color: #fff; 
  border: none; 
  padding: 8px 12px; 
  border-radius: 8px; 
  cursor: pointer; 
}

.primary:hover {
  background: #5f1cab; 
}

.danger { 
  background: #ef4444; 
  color: #fff; 
  border: none; 
  padding: 8px 12px; 
  border-radius: 8px; 
  cursor: pointer; 
}

.warn { 
  color: #ef4444; 
  text-align:center; 
}
</style>


