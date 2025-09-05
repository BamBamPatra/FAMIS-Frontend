import { setActivePinia, createPinia } from 'pinia'
import { useAdminUserStore } from '@/stores/adminUserStore'
import axios from 'axios'
import { TEST_USERS_INITIAL, TEST_ASSIGN, TEST_CHANGE, TEST_DELETE } from '@/views/Admin/__tests__/adminDashboard.testdata'

vi.mock('axios')

describe('Admin Dashboard - adminUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchUsers success', async () => {
    ;(axios.get as any).mockResolvedValue({ data: { users: TEST_USERS_INITIAL } })
    const store = useAdminUserStore()
    await store.fetchUsers()
    expect(store.users.length).toBe(TEST_USERS_INITIAL.length)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('assignUser success calls backend then refresh', async () => {
    ;(axios.post as any).mockResolvedValue({ status: 201 })
    ;(axios.get as any).mockResolvedValue({ data: { users: [ ...TEST_USERS_INITIAL, { id: 2001, email: TEST_ASSIGN.email, role: TEST_ASSIGN.role, department: TEST_ASSIGN.department } ] } })
    const store = useAdminUserStore()
    await store.assignUser(TEST_ASSIGN.email, TEST_ASSIGN.role, TEST_ASSIGN.department)
    expect(axios.post).toHaveBeenCalled()
    expect(store.users.some(u => u.email === TEST_ASSIGN.email)).toBe(true)
  })

  it('changeRole updates in store even if backend fails', async () => {
    ;(axios.patch as any).mockRejectedValue(new Error('fail'))
    const store = useAdminUserStore()
    store.users = JSON.parse(JSON.stringify(TEST_USERS_INITIAL)) as any
    await store.changeRole(TEST_CHANGE.userId, TEST_CHANGE.newRole)
    const changed = store.users.find(u => u.id === TEST_CHANGE.userId)!
    expect(changed.role).toBe(TEST_CHANGE.newRole)
  })

  it('deleteUser removes user even if backend fails', async () => {
    ;(axios.delete as any).mockRejectedValue(new Error('fail'))
    const store = useAdminUserStore()
    store.users = JSON.parse(JSON.stringify(TEST_USERS_INITIAL)) as any
    await store.deleteUser(TEST_DELETE.userId)
    expect(store.users.some(u => u.id === TEST_DELETE.userId)).toBe(false)
  })
})


