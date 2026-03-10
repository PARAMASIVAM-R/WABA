import mysql from 'mysql2/promise'
import { env } from '../config/env'
import { sendText, sendInteractiveButtons } from './whatsapp.service'

export async function sendAppointmentReminders() {
  const pool = mysql.createPool({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  try {
    // 1. Send 1-day before reminders (simple text)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const [dayBeforeApts] = await pool.query(
      `SELECT * FROM appointments 
       WHERE DATE(date) = ? 
       AND status IN ('confirmed', 'accepted')
       AND day_reminder_sent = 0`,
      [tomorrowStr]
    ) as any

    console.log(`📨 Sending 1-day reminders for ${dayBeforeApts.length} appointments`)

    for (const apt of dayBeforeApts) {
      await sendText(
        apt.phone,
        `🔔 Appointment Reminder\n\n👤 Name: ${apt.patient_name}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: Tomorrow\n🕐 Time: ${apt.time_slot}\n\n✅ Your appointment is confirmed!\n\n⏰ Please arrive 10 minutes early.\n\n❌ Need to cancel? Type "cancel"\n\nThank you! 🙏`
      )
      
      await pool.query(
        'UPDATE appointments SET day_reminder_sent = 1 WHERE id = ?',
        [apt.id]
      )
      
      console.log(`✅ 1-day reminder sent to ${apt.phone}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 2. Send 2-hour before reminders (with confirmation buttons)
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const twoHoursThirtyLater = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)
    
    const [twoHourApts] = await pool.query(
      `SELECT * FROM appointments 
       WHERE status IN ('confirmed', 'accepted') 
       AND hour_reminder_sent = 0
       AND CONCAT(date, ' ', SUBSTRING_INDEX(time_slot, ' - ', 1)) BETWEEN ? AND ?`,
      [
        twoHoursLater.toISOString().slice(0, 19).replace('T', ' '),
        twoHoursThirtyLater.toISOString().slice(0, 19).replace('T', ' ')
      ]
    ) as any

    console.log(`📨 Sending 2-hour reminders for ${twoHourApts.length} appointments`)

    for (const apt of twoHourApts) {
      const aptDate = new Date(apt.date)
      const dateStr = aptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      
      await sendInteractiveButtons(
        apt.phone,
        `🔔 Appointment Reminder\n\n👤 Name: ${apt.patient_name}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${dateStr}\n🕐 Time: ${apt.time_slot}\n\n⏰ Your appointment is in 2 hours!\n\nWill you be coming?`,
        [
          { id: `reminder_confirm_${apt.id}`, title: '✅ Yes, Coming' },
          { id: `reminder_cancel_${apt.id}`, title: '❌ Cancel' }
        ]
      )
      
      await pool.query(
        'UPDATE appointments SET hour_reminder_sent = 1 WHERE id = ?',
        [apt.id]
      )
      
      console.log(`✅ 2-hour reminder sent to ${apt.phone}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`✅ All reminders sent successfully`)
  } catch (error) {
    console.error('❌ Error sending reminders:', error)
  } finally {
    await pool.end()
  }
}
