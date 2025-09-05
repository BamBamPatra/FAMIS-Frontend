// M1: listPendingUploads() – Admin Verification (ForCheckView)
import { mount, flushPromises } from '@vue/test-utils'
import ForCheckView from '../ForCheckView.vue'
import ExtractKey from '@/service/ExtractKey'

vi.mock('@/service/ExtractKey')

describe('Admin Verification - M1 listPendingUploads()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('UT-M1-01 Successful Retrieval', async () => {
    const payload = {
      data: {
        status: 'success',
        uploads: [
          { file_id: 1, file_name: 'เอกสารใบขอซื้อ', uploaded_at: '2025-02-01T08:10:00Z', status: 'pending' },
        ],
      },
    }
    console.info('[M1][UT-M1-01] mock response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.listPendingUploads as any).mockResolvedValue(payload)
    const w = mount(ForCheckView)
    await flushPromises()
    expect(w.text()).toContain('เอกสารใบขอซื้อ')
  })

  it('UT-M1-04 No pending documents', async () => {
    const payload = { data: { status: 'success', uploads: [] } }
    console.info('[M1][UT-M1-04] mock response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.listPendingUploads as any).mockResolvedValue(payload)
    const w = mount(ForCheckView)
    await flushPromises()
    expect(w.text()).toContain('No financial documents submitted.')
  })

  it('UT-M1-02 Unauthorized Access', async () => {
    const err = { response: { data: { message: 'Unauthorized access.' } } }
    console.info('[M1][UT-M1-02] mock error:', JSON.stringify(err, null, 2))
    ;(ExtractKey.listPendingUploads as any).mockRejectedValue(err)
    const w = mount(ForCheckView)
    await flushPromises()
    expect(w.text()).toContain('Unauthorized access.')
  })

  it('UT-M1-03 Database Error', async () => {
    const err = { response: { data: { message: 'Unable to retrieve document list from database. Please try again later.' } } }
    console.info('[M1][UT-M1-03] mock error:', JSON.stringify(err, null, 2))
    ;(ExtractKey.listPendingUploads as any).mockRejectedValue(err)
    const w = mount(ForCheckView)
    await flushPromises()
    expect(w.text()).toContain('Unable to retrieve document list from database.')
  })
})


