import cron from 'node-cron'
import { sendAppointmentReminders } from '../services/reminder.service'

export function startReminderCron() {
  cron.schedule('0 18 * * *', async () => {
    console.log('⏰ Running appointment reminder cron job...')
    await sendAppointmentReminders()
  })
  
  console.log('✅ Reminder cron job scheduled (daily at 6 PM)')
}
