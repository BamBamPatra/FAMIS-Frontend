/* @vitest-environment node */
// Integration tests for Admin Dashboard (real HTTP)
// Enable with: RUN_INT_ADMIN=1 (or RUN_INT=1) and TEST_API_BASE if not 127.0.0.1:5000

import axios from 'axios'

const BASE = (process.env.TEST_API_BASE || 'http://127.0.0.1:5000').replace(/\/$/, '')
const RUN = [String(process.env.RUN_INT_ADMIN || ''), String(process.env.RUN_INT || '')]
  .some(v => v.toLowerCase() === 'true' || v === '1')

function log(label: string, value: any) {
  try { console.info(`[INT-ADM] ${label}:`, JSON.stringify(value, null, 2)) } catch { console.info(`[INT-ADM] ${label}:`, value) }
}

const suite = RUN ? describe : describe.skip

suite('[INT-ADM] Admin Dashboard API', () => {
  let createdIds: number[] = []
  // M1 Load_User_List
  describe('Admin Dashboard - M1 Load_User_List()', () => {
    it('UT-AD-M1-01 Successful Retrieval', async () => {
      const { data, status } = await axios.get(`${BASE}/admin/users`)
      log('UT-AD-M1-01 users', { statusCode: status, users: data?.users })
      expect(data?.status || 'success').toBe('success')
    })

    it('UT-AD-M1-02 Unauthorized Access', async () => {
      let code = 0
      try { await axios.get(`${BASE}/admin/users`, { headers: { 'X-Demo-Force-Unauthorized': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M1-02 unauthorized status', code)
      expect(code).toBe(403)
    })

    it('UT-AD-M1-03 Database Error', async () => {
      let code = 0
      try { await axios.get(`${BASE}/admin/users`, { headers: { 'X-Demo-Force-DbError': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M1-03 db error status', code)
      expect(code).toBe(500)
    })

    it('UT-AD-M1-04 Successful Retrieval with Filter (admin)', async () => {
      const { data } = await axios.get(`${BASE}/admin/users?role=admin`)
      log('UT-AD-M1-04 filter admin', data)
      expect(data?.status).toBe('success')
    })

    it('UT-AD-M1-05 Successful Retrieval with Empty Result', async () => {
      const { data } = await axios.get(`${BASE}/admin/users`, { headers: { 'X-Demo-Force-Empty': '1' } })
      log('UT-AD-M1-05 empty', data)
      expect(Array.isArray(data?.users)).toBe(true)
      expect(data.users.length).toBe(0)
    })

    it('UT-AD-M1-06 Pagination Test (?page=1)', async () => {
      const { data } = await axios.get(`${BASE}/admin/users?page=1`)
      log('UT-AD-M1-06 page=1', data)
      expect(Array.isArray(data?.page)).toBe(true)
    })
  })

  // M4 Add_user_email
  describe('Admin Dashboard - M4 Add_user_email()', () => {
    it('UT-AD-M4-01 Successful Assignment', async () => {
      const email = `new.user.${Date.now()}@cmu.ac.th`
      const payload = { email, role: 'staff', department: 'Faculty of Engineering' }
      const { data, status } = await axios.post(`${BASE}/admin/users`, payload)
      log('UT-AD-M4-01 create', { statusCode: status, data })
      expect(data?.status).toBe('success')
      createdIds.push(data.id)
    })

    it('UT-AD-M4-02 Email Already Exists', async () => {
      const { data: list } = await axios.get(`${BASE}/admin/users`)
      const email = list.users.find((u: any) => createdIds.includes(u.id))?.email
      let code = 0
      try { await axios.post(`${BASE}/admin/users`, { email, role: 'staff' }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M4-02 duplicate status', code)
      expect(code).toBe(409)
    })

    it('UT-AD-M4-03 Invalid Email Format', async () => {
      let code = 0
      try { await axios.post(`${BASE}/admin/users`, { email: 'test@gmail.com', role: 'staff' }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M4-03 invalid format', code)
      expect(code).toBe(400)
    })

    it('UT-AD-M4-04 Database Error', async () => {
      let code = 0
      try { await axios.post(`${BASE}/admin/users`, { email: `new.user2@cmu.ac.th`, role: 'staff' }, { headers: { 'X-Demo-Force-DbError': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M4-04 db error', code)
      expect(code).toBe(500)
    })
  })

  // M2 changeRole
  describe('Admin Dashboard - M2 changeRole(userId, role)', () => {
    it('UT-AD-M2-01 Successful Role Change', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `role.change.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      createdIds.push(userId)
      const { data } = await axios.patch(`${BASE}/admin/users/${userId}/role`, { role: 'admin' })
      log('UT-AD-M2-01 change role', data)
      expect(data?.status || 'ok').toBe('ok')
    })

    it('UT-AD-M2-02 User Not Found', async () => {
      let code = 0
      try { await axios.patch(`${BASE}/admin/users/999999/role`, { role: 'admin' }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M2-02 not found', code)
      expect(code).toBe(404)
    })

    it('UT-AD-M2-03 Database Error', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `role.dberror.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      createdIds.push(userId)
      let code = 0
      try { await axios.patch(`${BASE}/admin/users/${userId}/role`, { role: 'admin' }, { headers: { 'X-Demo-Force-DbError': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M2-03 db error', code)
      expect(code).toBe(500)
    })

    it('UT-AD-M2-04 Partial Success (Email fail)', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `role.partial.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      createdIds.push(userId)
      const { data } = await axios.patch(`${BASE}/admin/users/${userId}/role`, { role: 'admin' }, { headers: { 'X-Demo-Force-EmailFail': '1' } })
      log('UT-AD-M2-04 partial', data)
      expect(data?.status).toBe('partial_success')
    })

    it('UT-AD-M2-05 Unauthorized Access', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `role.unauth.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      createdIds.push(userId)
      let code = 0
      try { await axios.patch(`${BASE}/admin/users/${userId}/role`, { role: 'admin' }, { headers: { 'X-Demo-Force-Unauthorized': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M2-05 unauthorized', code)
      expect(code).toBe(403)
    })

    it('UT-AD-M2-06 Invalid Role Input', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `role.invalid.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      createdIds.push(userId)
      let code = 0
      try { await axios.patch(`${BASE}/admin/users/${userId}/role`, { role: 'guest' }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M2-06 invalid role', code)
      expect(code).toBe(400)
    })
  })

  // M3 deleteUser
  describe('Admin Dashboard - M3 deleteUser(userId)', () => {
    it('UT-AD-M3-01 Successful Deletion', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `delete.user.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      const { data } = await axios.delete(`${BASE}/admin/users/${userId}`)
      log('UT-AD-M3-01 delete', data)
      expect((data?.status || 'ok')).toBe('ok')
    })

    it('UT-AD-M3-02 Unauthorized Access', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `delete.unauth.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      let code = 0
      try { await axios.delete(`${BASE}/admin/users/${userId}`, { headers: { 'X-Demo-Force-Unauthorized': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M3-02 unauthorized', code)
      expect(code).toBe(403)
    })

    it('UT-AD-M3-03 Database Error', async () => {
      const made = await axios.post(`${BASE}/admin/users`, { email: `delete.dberror.${Date.now()}@cmu.ac.th`, role: 'staff' })
      const userId = made.data.id as number
      let code = 0
      try { await axios.delete(`${BASE}/admin/users/${userId}`, { headers: { 'X-Demo-Force-DbError': '1' } }) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M3-03 db error', code)
      expect(code).toBe(500)
    })

    it('UT-AD-M3-04 User Not Found', async () => {
      let code = 0
      try { await axios.delete(`${BASE}/admin/users/999999`) } catch (e: any) { code = e?.response?.status || 0 }
      log('UT-AD-M3-04 not found', code)
      expect(code).toBe(404)
    })
  })

  // Cleanup: remove users created during tests to avoid DB growth
  afterAll(async () => {
    for (const id of createdIds) {
      try { await axios.delete(`${BASE}/admin/users/${id}`) } catch {}
    }
  })
})


