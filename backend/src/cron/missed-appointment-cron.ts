import cron from 'node-cron'
import mysql from 'mysql2/promise'
import { env } from '../config/env'
import { sendText } from '../services/whatsapp.service'

const pool = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName
})

async function checkMissedAppointments() {
  try {
    console.log('🔍 Checking for missed appointments...')
    
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    // Get today's appointments that are confirmed/accepted but time has passed
    const [appointments] = await pool.query(`
      SELECT * FROM appointments 
      WHERE DATE(date) = ? 
      AND status IN ('confirmed', 'accepted')
    `, [todayStr]) as any
    
    let missedCount = 0
    
    for (const apt of appointments) {
      // Parse end time from time_slot (e.g., "9AM - 10AM")
      const endTimeMatch = apt.time_slot.match(/- (\d+)(AM|PM)/)
      if (!endTimeMatch) continue
      
      let endHour = parseInt(endTimeMatch[1])
      const period = endTimeMatch[2]
      
      if (period === 'PM' && endHour !== 12) endHour += 12
      if (period === 'AM' && endHour === 12) endHour = 0
      
      const slotEnd = new Date()
      slotEnd.setHours(endHour, 0, 0, 0)
      
      // If current time is past slot end time, mark as no-show
      if (now > slotEnd) {
        await pool.query(
          'UPDATE appointments SET status = ? WHERE id = ?',
          ['no_show', apt.id]
        )
        
        await sendText(
          apt.phone,
          `⚠️ Missed Appointment Notice\n\nHello ${apt.patient_name},\n\nWe noticed you missed your appointment today:\n👨⚕️ Doctor: ${apt.doctor}\n🕐 Time: ${apt.time_slot}\n\nWould you like to reschedule?\nReply "reschedule" to book a new appointment.\n\nThank you!`
        )
        
        missedCount++
        console.log(`📧 Sent no-show message to ${apt.patient_name} (${apt.phone})`)
      }
    }
    
    console.log(`✅ Checked missed appointments: ${missedCount} no-shows detected`)
  } catch (error) {
    console.error('❌ Error checking missed appointments:', error)
  }
}

export function startMissedAppointmentCron() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', checkMissedAppointments)
  console.log('✅ Missed appointment checker scheduled (every 30 minutes)')
}
