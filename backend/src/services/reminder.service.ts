import mysql from 'mysql2/promise'
import { env } from '../config/env'
import { sendText } from './whatsapp.service'

export async function sendAppointmentReminders() {
  const pool = mysql.createPool({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  try {
    const [appointments] = await pool.query(
      `SELECT * FROM appointments 
       WHERE DATE(date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
       AND status IN ('confirmed', 'accepted')`,
      []
    ) as any

    console.log(`📨 Sending reminders for ${appointments.length} appointments`)

    for (const apt of appointments) {
      const message = `🔔 Appointment Reminder\n\n👤 Name: ${apt.patient_name}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: Tomorrow\n🕐 Time: ${apt.time_slot}\n\n✅ Your appointment is confirmed!\n\n⏰ Please arrive 10 minutes early.\n\n❌ Need to cancel? Type "cancel"\n\nThank you! 🙏`
      
      await sendText(apt.phone, message)
      console.log(`✅ Reminder sent to ${apt.phone}`)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`✅ All reminders sent successfully`)
  } catch (error) {
    console.error('❌ Error sending reminders:', error)
  } finally {
    await pool.end()
  }
}
