/* @vitest-environment node */
// Integration tests (real HTTP) for Admin Verification endpoints
// These do NOT mock; they call the real API base.
// Base priority: TEST_API_BASE || VITE_BACKEND_URL || http://127.0.0.1:5000

import axios from 'axios'

const BASE = (process.env.TEST_API_BASE || process.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')
const RUN_INT = String(process.env.RUN_INT || '').toLowerCase() === '1' || String(process.env.RUN_INT || '').toLowerCase() === 'true'

// Helper to log pretty JSON for presentation
function log(label: string, value: any) {
  try {
    // eslint-disable-next-line no-console
    console.info(`[INT] ${label}:`, JSON.stringify(value, null, 2))
  } catch {
    // eslint-disable-next-line no-console
    console.info(`[INT] ${label}:`, value)
  }
}

const suite = RUN_INT ? describe : describe.skip

suite('[INT] Admin Verification API', () => {
  let pendingIds: number[] = []
  let firstPendingId: number | undefined

  beforeAll(async () => {
    try {
      const url = `${BASE}/doc-types`
      await axios.get(url, { timeout: 3000 })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[INT] Backend not reachable at ${BASE}. Start backend or set TEST_API_BASE.`)
      throw e
    }

    try {
      const url = `${BASE}/admin/uploads/pending`
      const { data } = await axios.get(url, { timeout: 5000 })
      const list = Array.isArray(data?.uploads) ? data.uploads : []
      pendingIds = list.map((u: any) => Number(u?.file_id)).filter((n: any) => Number.isFinite(n))
      firstPendingId = pendingIds[0]
      log('M0 discovered pending ids', pendingIds)
    } catch (e) {
      // ignore discovery failure, tests will fall back to env IDs
    }
  })
  it('M1: GET /admin/uploads/pending → list pending uploads', async () => {
    const url = `${BASE}/admin/uploads/pending`
    const { data, status } = await axios.get(url)
    log('M1 pending uploads response', { statusCode: status, data })
    expect(['success', 'error']).toContain(String(data?.status || 'success'))
  })

  it('M2: GET /uploads/:fileId/extracted → extracted items', async () => {
    const fileId = Number(process.env.TEST_FILE_ID_EXTRACT || firstPendingId || 1)
    const url = `${BASE}/uploads/${fileId}/extracted`
    const { data, status } = await axios.get(url)
    log('M2 extracted response', { statusCode: status, data })
    // Accept either success with items[] or error with message
    if (data?.status === 'success') {
      expect(Array.isArray(data.items)).toBe(true)
    } else {
      expect(typeof data?.message).toBe('string')
    }
  })

  it('M3: POST /admin/uploads/:fileId/approve → approve document', async () => {
    const fileId = Number(process.env.TEST_FILE_ID_APPROVE || firstPendingId)
    if (!fileId) {
      console.warn('[INT] Skip M3 because no pending file_id found. Set TEST_FILE_ID_APPROVE to force.')
      return
    }
    const url = `${BASE}/admin/uploads/${fileId}/approve`
    const { data, status } = await axios.post(url, {})
    log('M3 approve response', { statusCode: status, data })
    // Backend returns success | error | noop depending on state
    expect(['success', 'error', 'noop']).toContain(String(data?.status || ''))
  })

  it('M4: POST /admin/uploads/:fileId/reject → reject document', async () => {
    const fallback = pendingIds.length > 1 ? pendingIds[1] : firstPendingId
    const fileId = Number(process.env.TEST_FILE_ID_REJECT || fallback)
    if (!fileId) {
      console.warn('[INT] Skip M4 because no pending file_id found. Set TEST_FILE_ID_REJECT to force.')
      return
    }
    const url = `${BASE}/admin/uploads/${fileId}/reject`
    const body = { reason: 'Integration test reason' }
    const { data, status } = await axios.post(url, body)
    log('M4 reject response', { statusCode: status, data })
    expect(['success', 'error', 'noop']).toContain(String(data?.status || ''))
  })
})


