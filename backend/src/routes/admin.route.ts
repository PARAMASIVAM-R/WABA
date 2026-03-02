import { Router } from 'express'
import mysql from 'mysql2/promise'
import { env } from '../config/env'
import { sendText } from '../services/whatsapp.service'
import { getAllTimeSlotsByDoctor } from '../services/db.service'

const router = Router()

const pool = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName
})

// Get all doctors with their categories
router.get('/doctors', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT d.id, d.name, c.name as category
    FROM doctors d
    JOIN categories c ON d.category_id = c.id
    ORDER BY c.name, d.name
  `)
  res.json({ doctors: rows })
})

// Get time slots for a doctor
router.get('/doctors/:doctorId/slots', async (req, res) => {
  const { doctorId } = req.params
  const slots = await getAllTimeSlotsByDoctor(parseInt(doctorId))
  res.json({ slots })
})

// Get pending appointments
router.get('/pending', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT * FROM appointments 
    WHERE status = 'pending' 
    ORDER BY created_at DESC
  `)
  res.json({ appointments: rows })
})

// Accept appointment
router.post('/:id/accept', async (req, res) => {
  const { id } = req.params
  
  const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]) as any
  if (!appointment[0]) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  await pool.query('UPDATE appointments SET status = ? WHERE id = ?', ['accepted', id])
  
  const apt = appointment[0]
  await sendText(
    apt.phone,
    `✅ Appointment Confirmed!\n\n👤 Name: ${apt.patient_name}\n🏥 Category: ${apt.category}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${apt.date}\n🕐 Time: ${apt.time_slot}\n\nYour appointment has been confirmed. Please arrive 10 minutes early.\n\nThank you! 🙏`
  )
  
  res.json({ success: true, message: 'Appointment accepted' })
})

// Suggest alternate slot
router.post('/:id/alternate', async (req, res) => {
  const { id } = req.params
  const { alternateSlot } = req.body
  
  const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]) as any
  if (!appointment[0]) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  await pool.query(
    'UPDATE appointments SET status = ?, alternate_slot = ? WHERE id = ?',
    ['alternate_suggested', alternateSlot, id]
  )
  
  const apt = appointment[0]
  await sendText(
    apt.phone,
    `⏰ Alternate Time Suggested\n\n👤 Name: ${apt.patient_name}\n🏥 Category: ${apt.category}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${apt.date}\n\n❌ Requested: ${apt.time_slot}\n✅ Suggested: ${alternateSlot}\n\nThe requested time is not available. Please reply 'accept' to confirm the alternate time or 'reject' to cancel.`
  )
  
  res.json({ success: true, message: 'Alternate slot suggested' })
})

// Reject appointment
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  
  const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]) as any
  if (!appointment[0]) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  await pool.query(
    'UPDATE appointments SET status = ?, rejection_reason = ? WHERE id = ?',
    ['rejected', reason, id]
  )
  
  // Free up the time slot - find and mark as available
  const apt = appointment[0]
  await pool.query(
    `UPDATE time_slots ts
     JOIN doctors d ON ts.doctor_id = d.id
     SET ts.is_booked = FALSE
     WHERE d.name = ? AND TIME_FORMAT(ts.start_time, '%h:%i %p') = ?`,
    [apt.doctor, apt.time_slot]
  )
  
  await sendText(
    apt.phone,
    `❌ Appointment Request Declined\n\n👤 Name: ${apt.patient_name}\n🏥 Category: ${apt.category}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${apt.date}\n🕐 Time: ${apt.time_slot}\n\nReason: ${reason}\n\nPlease contact the hospital or try booking again with a different time.`
  )
  
  res.json({ success: true, message: 'Appointment rejected and slot freed' })
})

export default router
