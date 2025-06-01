// stores/financialKeyStore.ts
import { defineStore } from 'pinia'
import type { FinancialKey } from '@/type/FinancialKey'

export const useFinancialKeyStore = defineStore('financialKey', {
  state: () => ({
    financialKeys: [] as FinancialKey[],
    fileName: null as string | null
  }),
  actions: {
    setKeys(keys: FinancialKey[]) {
      this.financialKeys = keys
    },
    setFileName(name: string) {
      this.fileName = name
    }
  }
})
