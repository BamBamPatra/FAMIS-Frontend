import { defineStore } from 'pinia'
import axios from 'axios'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    filename: '' as string,
    notifications: [] as {
      status: 'processing' | 'complete' | 'error',
      message: string,
      timestamp: string,
      taskId?: string  
    }[],
    intervalId: null as null | number,
    currentTaskId: '' as string, 
  }),
  actions: {
    async startPolling(taskId: string, filename?: string) {
        const safeFilename = filename || 'File'
        this.filename = safeFilename
        this.currentTaskId = taskId
        
      // ถ้า polling อยู่แล้วกับ taskId เดิม ไม่เริ่มใหม่
      if (this.intervalId && this.currentTaskId === taskId) return
      // ถ้า polling อยู่กับ taskId อื่น ให้หยุดก่อน แล้วเริ่มใหม่
      if (this.intervalId && this.currentTaskId !== taskId) {
        this.stopPolling()
      }

      // เช็ค backend ก่อน
      try {
        await axios.get(`http://127.0.0.1:5000/status/${taskId}`)
      } catch {
        return
      }

      // เช็คว่ามี notification ของ taskId นี้อยู่แล้วหรือยัง
      const exists = this.notifications.some(
        (noti) => noti.taskId === taskId && noti.status === 'processing'
      )
      if (!exists) {
        this.notifications.push({
          status: 'processing',
          message: `${safeFilename} is being processed.`,
          timestamp: new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          taskId,
        })
      }

      this.intervalId = window.setInterval(async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:5000/status/${taskId}`)
            const job = res.data

            console.log('Polling status:', job.status) 

            if (job.status !== 'processing') {
            const existsFinal = this.notifications.some(
                (noti) => noti.taskId === taskId && noti.status === job.status
            )
            if (!existsFinal) {
                this.notifications.push({
                status: job.status,
                message:
                    job.message || `${safeFilename} is ${ job.status === 'complete' ? 'successfully processed' : 'failed to process'}.`,
                    timestamp: new Date().toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    }),
                    taskId,
                })
            }

            this.stopPolling()
            }
        } catch {
            this.notifications.push({
            status: 'error',
            message: `⚠️ Cannot check status of ${safeFilename}.`,
            timestamp: new Date().toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
            }),
            taskId,
            })

            this.stopPolling()
        }
        }, 2000)

    },

    stopPolling() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
        this.currentTaskId = ''
      }
    },
    
  },
})
