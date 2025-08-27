<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAdminUserStore, type AdminUser, type AdminRole } from '@/stores/adminUserStore'
import { useToastStore } from '@/stores/popupStore'

const toast = useToastStore()
const adminStore = useAdminUserStore()
const currentPage = ref(1)
const pageSize = 20
const searchQuery = ref('')

// Filter function
const filterRoles = ref<{ admin: boolean; staff: boolean }>({
  admin: false,
  staff: false,
})

const filteredUsers = computed(() => {
  const rolesSelected = Object.entries(filterRoles.value)
    .filter(([_, checked]) => checked)
    .map(([role]) => role)

  let result = [...adminStore.users]

  // Filter by role
  if (rolesSelected.length > 0) {
    result = result.filter((u) => rolesSelected.includes(u.role))
  }

  // Filter by search
  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)),
    )
  }

  return result.sort((a, b) => {
    if (a.role === b.role) return 0
    return a.role === 'admin' ? -1 : 1
  })
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize))

// Pagination
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredUsers.value.slice(start, end)
})

watch(filteredUsers, () => {
  currentPage.value = 1
})

const showAssign = ref(false)
const assignEmail = ref('')
const assignRole = ref<AdminRole>('staff')

const showChange = ref(false)
const selectedUser = ref<AdminUser | null>(null)
const changeRole = ref<AdminRole>('staff')
const showDelete = ref(false)

// Add new user
const openAssign = () => {
  showAssign.value = true
}
const closeAssign = () => {
  showAssign.value = false
  assignEmail.value = ''
  assignRole.value = 'staff'
}
const confirmAssign = async () => {
  try {
    await adminStore.assignUser(assignEmail.value, assignRole.value)
    toast.trigger(`${assignEmail.value} is already registered.`, 'info')
    closeAssign()
  } catch (err) {
    toast.trigger('Failed to add user.', 'error')
  }
}

// Change role
const openChange = (u: AdminUser) => {
  selectedUser.value = u
  changeRole.value = u.role
  showChange.value = true
}
const closeChange = () => {
  showChange.value = false
  selectedUser.value = null
}
const confirmChange = async () => {
  if (!selectedUser.value) return
  try {
    await adminStore.changeRole(selectedUser.value.id, changeRole.value)
    toast.trigger(`${selectedUser.value.email} role is successfully updated.`, 'success')
    closeChange()
  } catch (err) {
    toast.trigger('Failed to update role.', 'error')
  }
}

// Delete user
const openDelete = (u: AdminUser) => {
  selectedUser.value = u
  showDelete.value = true
}
const closeDelete = () => {
  showDelete.value = false
  selectedUser.value = null
}
const confirmDelete = async () => {
  if (!selectedUser.value) return
  try {
    await adminStore.deleteUser(selectedUser.value.id)
    toast.trigger(`${selectedUser.value.email} account has been successfully removed.`, 'success')
    closeDelete()
  } catch (err) {
    toast.trigger('Failed to deletr user.', 'error')
  }
}

onMounted(() => {
  adminStore.fetchUsers()
})
</script>

<template>
  <div class="content">

    <!-- Toolbar -->
    <div class="toolbar">

      <div class="left">
        <!-- Search bar -->
        <div class="search-bar">
          <input v-model.trim="searchQuery" class="search-input" placeholder="Search by email or department..." />
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 512 512">
            <path d="M505 442.7L405.3 343c28.3-34.9 45.3-79 45.3-127C450.6 96.5 354.1 0 232.8 0S15 96.5 15 216.1s96.5 216.1 216.1 216.1c48 0 92.1-17 127-45.3l99.7 99.7c9.3 9.3 24.6 9.3 33.9 0l14.3-14.3c9.3-9.3 9.3-24.6 0-33.9zM232.8 376.2c-88.5 0-160.1-71.6-160.1-160.1S144.3 56 232.8 56s160.1 71.6 160.1 160.1-71.6 160.1-160.1 160.1z"/>
          </svg>
        </div>

        <!-- Filters -->
        <div class="filter-row">
          <button class="filter-btn" :class="{ active: filterRoles.admin }" @click="filterRoles.admin = !filterRoles.admin">
            Admin
          </button>
          <button class="filter-btn" :class="{ active: filterRoles.staff }" @click="filterRoles.staff = !filterRoles.staff">
            Staff
          </button>
        </div>
      </div>

      <!-- Add new user -->
      <button class="assign-btn" @click="openAssign">+ ADD NEW USER</button>
    </div>

    <!-- Table -->
    <div class="table">
      <div class="thead">
        <div class="th">Role</div>
        <div class="th">Mail</div>
        <div class="th">Department</div>
        <div class="th actions">Actions</div>
      </div>

      <div class="row" v-for="u in paginatedUsers" :key="u.id">
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
          <button class="primary" @click="confirmDelete" :disabled="!selectedUser">CONFIRM</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon-pagination" viewBox="0 0 640 640">
          <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
        </svg>
      </button>

      <button v-for="page in totalPages" :key="page" class="page-btn" :class="{ active: currentPage === page }" @click="currentPage = page">
        {{ page }}
      </button>

      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon-pagination" viewBox="0 0 640 640">
          <path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 24px;
}

.table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.thead,
.row {
  display: grid;
  grid-template-columns: 160px 1fr 1fr 160px;
  align-items: center;
}

.thead {
  background: #f8fafc;
  font-weight: 600;
}

.th,
.cell {
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  background: #fff;
  min-width: 420px;
  border-radius: 12px;
  padding: 24px;
  display: flex;
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

.dialog input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
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
  background: #9b7ebd;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.primary:hover {
  background: #387F39;
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
  text-align: center;
}

/* Filter */

.filter-btn {
  padding: 6px 14px;
  border-radius: 999px; 
  border: 1px solid #ccc;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: #f3f0ff;
  border-color: #7c3aed;
  color: #7c3aed;
}

.filter-btn.active {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.25);
}

/* Pagination */
.pagination {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.page-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #ede9fe;
  border-color: #7c3aed;
}

.page-btn.active {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-pagination {
  width: 14px;
  height: 14px;
  fill: currentColor;
  vertical-align: middle;
}

.filter-search-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.toolbar {
  display: flex;
  justify-content: space-between; /* ดันซ้าย-ขวา */
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}


.filter-row {
  display: flex;
  gap: 0.5rem;
  margin-right: 320px;
}

.assign-btn {
  background: #7c3aed;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.assign-btn:hover {
  background: #5b21b6;
}

/* Search Bar */
.search-bar {
  position: relative;
  background-color: #f3f4f6;
  border-radius: 999px;
  display: flex;
  align-items: center;
  width: 600px;
  padding: 6px 12px;
}
.search-input {
  border: none;
  background: transparent;
  padding: 8px 32px 8px 8px;
  font-size: 14px;
  width: 500px;
  outline: none;
}
.search-icon {
  position: absolute;
  right: 14px;
  width: 18px;
  height: 18px;
  fill: #555;
  pointer-events: none;
}

</style>
