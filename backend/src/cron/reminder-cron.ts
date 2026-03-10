import cron from 'node-cron'
import { sendAppointmentReminders } from '../services/reminder.service'

export function startReminderCron() {
  // Reminder cron disabled
  console.log('⏸️  Reminder cron job disabled')
}
