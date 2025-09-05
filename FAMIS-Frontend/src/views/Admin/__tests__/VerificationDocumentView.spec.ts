// M2–M4: Admin Verification – VerificationDocumentView
import { mount, flushPromises } from '@vue/test-utils'
import VerificationDocumentView from '../VerificationDocumentView.vue'
import ExtractKey from '@/service/ExtractKey'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('@/service/ExtractKey')

async function mountWithRoute(fileId = 1) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/for-check/:fileId', name: 'verificationDocument', component: VerificationDocumentView },
      { path: '/for-check', name: 'forCheck', component: { template: '<div>for-check</div>' } },
    ],
  })
  router.push(`/for-check/${fileId}`)
  await router.isReady()
  const wrapper = mount(VerificationDocumentView, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('Admin Verification - M2 getExtractedByFile(fileId)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('UT-M2-01 Successful load shows tables', async () => {
    const payload = {
      data: {
        status: 'success',
        items: [
          { data_id: 101, page: 1, amount: 50000, file_url: 'http://x/u.pdf', upload_status: 'pending' },
          { data_id: 102, page: 2, amount: 50000, file_url: 'http://x/u.pdf', upload_status: 'pending' },
        ],
      },
    }
    console.info('[M2][UT-M2-01] mock response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    expect(wrapper.text()).toContain('Reference Document')
    expect(wrapper.text()).toContain('Financial Document')
  })

  it('UT-M2-02 Document Not Found', async () => {
    const payload = { data: { status: 'error', message: 'Unable to load extracted data.' } }
    console.info('[M2][UT-M2-02] mock response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const { wrapper } = await mountWithRoute(999)
    await flushPromises()
    expect(wrapper.text()).toContain('Unable to load extracted data.')
  })

  it('UT-M2-03 Unauthorized Access', async () => {
    const payload = { data: { status: 'error', message: 'Unauthorized access.' } }
    console.info('[M2][UT-M2-03] mock response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    expect(wrapper.text()).toContain('Unauthorized access.')
  })

  it('UT-M2-04 Database Error', async () => {
    const payload = { data: { status: 'error', message: 'Unable to load extracted data.' } }
    console.info('[M2][UT-M2-04] mock response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const { wrapper } = await mountWithRoute(2)
    await flushPromises()
    expect(wrapper.text()).toContain('Unable to load extracted data.')
  })
})

describe('Admin Verification - M3 approveUpload(file_id)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('UT-M3-01 Successful Approval', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M3][UT-M3-01] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const approveRes = { data: { status: 'success', message: 'Document doc_1 approved successfully.' } }
    console.info('[M3][UT-M3-01] mock approve response:', JSON.stringify(approveRes, null, 2))
    ;(ExtractKey.approveUpload as any).mockResolvedValue(approveRes)

    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    await wrapper.find('select').setValue('approved')
    await wrapper.find('.btn-confirm').trigger('click')
    expect(ExtractKey.approveUpload).toHaveBeenCalledWith(1, undefined)
  })

  it('UT-M3-02 Document Not Found / Not Pending', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M3][UT-M3-02] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const approveRes = { data: { status: 'error', message: 'Document not found or is not in a pending state.' } }
    console.info('[M3][UT-M3-02] mock approve response:', JSON.stringify(approveRes, null, 2))
    ;(ExtractKey.approveUpload as any).mockResolvedValue(approveRes)

    const { wrapper } = await mountWithRoute(999)
    await flushPromises()
    await wrapper.find('select').setValue('approved')
    await wrapper.find('.btn-confirm').trigger('click')
    expect(ExtractKey.approveUpload).toHaveBeenCalled()
    const call = (ExtractKey.approveUpload as any).mock.results.at(-1).value
    const res = await call
    expect(res.data).toEqual({ status: 'error', message: 'Document not found or is not in a pending state.' })
  })

  it('UT-M3-04 Database Error', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M3][UT-M3-04] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const approveRes = { data: { status: 'error', message: 'Failed to update document status due to a database error.' } }
    console.info('[M3][UT-M3-04] mock approve response:', JSON.stringify(approveRes, null, 2))
    ;(ExtractKey.approveUpload as any).mockResolvedValue(approveRes)
    const { wrapper } = await mountWithRoute(3)
    await flushPromises()
    await wrapper.find('select').setValue('approved')
    await wrapper.find('.btn-confirm').trigger('click')
    const call = (ExtractKey.approveUpload as any).mock.results.at(-1).value
    const res = await call
    expect(res.data).toEqual({ status: 'error', message: 'Failed to update document status due to a database error.' })
  })

  it('UT-M3-05 Unauthorized (non-admin)', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M3][UT-M3-05] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const approveRes = { data: { status: 'error', message: 'Unauthorized access.' } }
    console.info('[M3][UT-M3-05] mock approve response:', JSON.stringify(approveRes, null, 2))
    ;(ExtractKey.approveUpload as any).mockResolvedValue(approveRes)
    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    await wrapper.find('select').setValue('approved')
    await wrapper.find('.btn-confirm').trigger('click')
    const call = (ExtractKey.approveUpload as any).mock.results.at(-1).value
    const res = await call
    expect(res.data).toEqual({ status: 'error', message: 'Unauthorized access.' })
  })
})

describe('Admin Verification - M4 rejectUpload(file_id, reason)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('UT-M4-01 Successful Rejection', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M4][UT-M4-01] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const rejectRes = { data: { status: 'success', message: 'Document doc_1 rejected successfully.' } }
    console.info('[M4][UT-M4-01] mock reject response:', JSON.stringify(rejectRes, null, 2))
    ;(ExtractKey.rejectUpload as any).mockResolvedValue(rejectRes)

    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    await wrapper.find('select').setValue('rejected')
    await wrapper.find('.btn-confirm').trigger('click')
    await flushPromises()
    await wrapper.find('textarea').setValue('Signature mismatch.')
    await wrapper.find('.modal-actions button:last-child').trigger('click')
    expect(ExtractKey.rejectUpload).toHaveBeenCalledWith(1, 'Signature mismatch.')
  })

  it('UT-M4-02 Reason Missing', async () => {
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue({ data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } })
    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    await wrapper.find('select').setValue('rejected')
    await wrapper.find('.btn-confirm').trigger('click')
    await flushPromises()
    // no reason -> click submit; component will prevent submit
    const before = (ExtractKey.rejectUpload as any).mock.calls.length
    await wrapper.find('.modal-actions button:last-child').trigger('click')
    const after = (ExtractKey.rejectUpload as any).mock.calls.length
    expect(after).toBe(before)
  })

  it('UT-M4-03 Document Not Found', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M4][UT-M4-03] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const rejectRes = { data: { status: 'error', message: 'Document not found or is not in a pending state.' } }
    console.info('[M4][UT-M4-03] mock reject response:', JSON.stringify(rejectRes, null, 2))
    ;(ExtractKey.rejectUpload as any).mockResolvedValue(rejectRes)
    const { wrapper } = await mountWithRoute(111)
    await flushPromises()
    await wrapper.find('select').setValue('rejected')
    await wrapper.find('.btn-confirm').trigger('click')
    await flushPromises()
    await wrapper.find('textarea').setValue('Test')
    await wrapper.find('.modal-actions button:last-child').trigger('click')
    const call = (ExtractKey.rejectUpload as any).mock.results.at(-1).value
    const res = await call
    expect(res.data).toEqual({ status: 'error', message: 'Document not found or is not in a pending state.' })
  })

  it('UT-M4-04 Document Not Pending', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M4][UT-M4-04] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const rejectRes = { data: { status: 'error', message: 'Document not found or is not in a pending state.' } }
    console.info('[M4][UT-M4-04] mock reject response:', JSON.stringify(rejectRes, null, 2))
    ;(ExtractKey.rejectUpload as any).mockResolvedValue(rejectRes)
    const { wrapper } = await mountWithRoute(456)
    await flushPromises()
    await wrapper.find('select').setValue('rejected')
    await wrapper.find('.btn-confirm').trigger('click')
    await flushPromises()
    await wrapper.find('textarea').setValue('Test')
    await wrapper.find('.modal-actions button:last-child').trigger('click')
    const call = (ExtractKey.rejectUpload as any).mock.results.at(-1).value
    const res = await call
    expect(res.data).toEqual({ status: 'error', message: 'Document not found or is not in a pending state.' })
  })

  it('UT-M4-05 Unauthorized (non-admin)', async () => {
    const payload = { data: { status: 'success', items: [ { page: 1, file_url: 'http://x/u.pdf', upload_status: 'pending' } ] } }
    console.info('[M4][UT-M4-05] mock get response:', JSON.stringify(payload, null, 2))
    ;(ExtractKey.getExtractedByFile as any).mockResolvedValue(payload)
    const rejectRes = { data: { status: 'error', message: 'Unauthorized access.' } }
    console.info('[M4][UT-M4-05] mock reject response:', JSON.stringify(rejectRes, null, 2))
    ;(ExtractKey.rejectUpload as any).mockResolvedValue(rejectRes)
    const { wrapper } = await mountWithRoute(1)
    await flushPromises()
    await wrapper.find('select').setValue('rejected')
    await wrapper.find('.btn-confirm').trigger('click')
    await flushPromises()
    await wrapper.find('textarea').setValue('Am not an admin')
    await wrapper.find('.modal-actions button:last-child').trigger('click')
    const call = (ExtractKey.rejectUpload as any).mock.results.at(-1).value
    const res = await call
    expect(res.data).toEqual({ status: 'error', message: 'Unauthorized access.' })
  })
})


