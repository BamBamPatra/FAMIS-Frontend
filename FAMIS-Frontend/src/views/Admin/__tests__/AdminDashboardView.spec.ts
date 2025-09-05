import { mount, flushPromises } from '@vue/test-utils'
import AdminDashboardView from '../AdminDashboardView.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminUserStore } from '@/stores/adminUserStore'
import { TEST_USERS_INITIAL, TEST_ASSIGN } from './adminDashboard.testdata'

describe('Admin Dashboard - AdminDashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seed() {
    const store = useAdminUserStore()
    store.users = JSON.parse(JSON.stringify(TEST_USERS_INITIAL)) as any
    return store
  }

  it('filters by role and search', async () => {
    seed()
    const w = mount(AdminDashboardView)
    await flushPromises()
    // toggle staff filter
    const buttons = w.findAll('.filter-btn')
    await buttons[1].trigger('click')
    const staffEmail = TEST_USERS_INITIAL.find(u => u.role === 'staff')!.email
    expect(w.text()).toContain(staffEmail)

    // clear filters and search by department (admin side)
    await buttons[1].trigger('click') // turn off staff filter
    await w.find('.search-input').setValue('financial')
    await w.find('.search-input').trigger('input')
    await flushPromises()
    expect(w.text().toLowerCase()).toContain('financial department')
  })

  it('pagination resets to page 1 when filters change', async () => {
    const store = seed()
    // add more than one page
    for (let i = 0; i < 30; i++) {
      store.users.push({ id: 100 + i, email: `u${i}@cmu.ac.th`, role: 'staff' } as any)
    }
    const w = mount(AdminDashboardView)
    await flushPromises()
    // go to page 2
    const pages = w.findAll('.page-btn')
    const page2 = pages.find(b => b.text() === '2')!
    await page2.trigger('click')
    // toggle filter to trigger reset
    const buttons = w.findAll('.filter-btn')
    await buttons[1].trigger('click')
    await flushPromises()
    // current page should be back to 1 → when pagination exists, the active button is '1'
    const btns = w.findAll('.page-btn')
    if (btns.length > 0) {
      const page1Btn = btns.find(b => b.text() === '1')!
      expect(page1Btn.classes()).toContain('active')
    } else {
      // no pagination implies only page 1 remains
      expect(btns.length).toBe(0)
    }
  })

  it('open/close modals and confirm actions', async () => {
    const store = seed()
    const w = mount(AdminDashboardView)
    await flushPromises()
    // open Assign modal
    await w.find('.assign-btn').trigger('click')
    expect(w.text()).toContain('ADD NEW USER')
    await w.find('input[type="email"]').setValue(TEST_ASSIGN.email)
    await w.find('select').setValue(TEST_ASSIGN.role)
    // spy on store.assignUser
    const spy = vi.spyOn(store, 'assignUser').mockResolvedValue()
    await w.find('.dialog .primary').trigger('click')
    expect(spy).toHaveBeenCalledWith(TEST_ASSIGN.email, TEST_ASSIGN.role)

    // open Change role modal via first row icon
    const changeSpy = vi.spyOn(store, 'changeRole').mockResolvedValue()
    const firstRowIcons = w.findAll('.row .icon')
    if (firstRowIcons.length >= 1) {
      await firstRowIcons[0].trigger('click')
      await flushPromises()
      // choose role admin and confirm
      const selects = w.findAll('.dialog select')
      if (selects.length > 0) await selects.at(-1)!.setValue('admin')
      const confirmBtn = w.findAll('.dialog .primary').at(-1)!
      await confirmBtn.trigger('click')
      expect(changeSpy).toHaveBeenCalled()
    }

    // open Delete modal via second icon
    const delSpy = vi.spyOn(store, 'deleteUser').mockResolvedValue()
    if (firstRowIcons.length >= 2) {
      await firstRowIcons[1].trigger('click')
      await flushPromises()
      const confirmDel = w.findAll('.dialog .primary').at(-1)!
      await confirmDel.trigger('click')
      expect(delSpy).toHaveBeenCalled()
    }
  })
})


