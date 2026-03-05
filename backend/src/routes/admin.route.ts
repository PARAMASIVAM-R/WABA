import { Router } from 'express'
import mysql from 'mysql2/promise'
import { env } from '../config/env'
import { sendText } from '../services/whatsapp.service'
import { getAllTimeSlotsByDoctor, createDoctor, updateDoctor, deleteDoctor, createTimeSlot, deleteTimeSlot, getCategories } from '../services/db.service'
import { formatDate } from '../utils/date.util'

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

// Get time slots and appointments for a doctor
router.get('/doctors/:doctorId/slots', async (req, res) => {
  const { doctorId } = req.params
  
  const [doctor] = await pool.query(
    'SELECT name FROM doctors WHERE id = ?',
    [doctorId]
  ) as any
  
  if (!doctor[0]) {
    return res.json({ timeSlots: [], appointments: [] })
  }
  
  const [timeSlots] = await pool.query(
    'SELECT id, doctor_id, start_time, end_time, capacity, DATE_FORMAT(date, "%Y-%m-%d") as date, created_at FROM time_slots WHERE doctor_id = ? ORDER BY date, start_time',
    [doctorId]
  ) as any
  
  const [appointments] = await pool.query(
    `SELECT id, patient_name, phone, DATE_FORMAT(date, '%Y-%m-%d') as date, time_slot, status, token_number, created_at
     FROM appointments 
     WHERE doctor = ?
     ORDER BY date DESC, time_slot, created_at`,
    [doctor[0].name]
  ) as any
  
  res.json({ 
    timeSlots,
    appointments
  })
})

// Get today's visits
router.get('/today', async (req, res) => {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    console.log('\n=== TODAY VISITS REQUEST ===')
    console.log('Looking for date:', todayStr)
    
    // First check all appointments to debug
    const [allRows] = await pool.query('SELECT id, patient_name, date, status FROM appointments ORDER BY date DESC LIMIT 10') as any
    console.log('Recent appointments in DB:', allRows)
    
    const [rows] = await pool.query(`
      SELECT * FROM appointments 
      WHERE DATE(date) = ? AND status IN ('accepted', 'visited', 'completed')
      ORDER BY doctor, time_slot, token_number
    `, [todayStr]) as any
    
    console.log('Matching today visits:', rows.length)
    console.log('===========================\n')
    
    res.json({ appointments: rows })
  } catch (error) {
    console.error('Error fetching today visits:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
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
    `✅ Appointment Accepted!\n\n👤 Name: ${apt.patient_name}\n🏥 Category: ${apt.category}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n🕐 Time: ${apt.time_slot}\n\nYour appointment has been accepted. On the appointment date, please visit the hospital. You will receive a token number after the receptionist confirms your visit.\n\nThank you! 🙏`
  )
  
  res.json({ success: true, message: 'Appointment accepted' })
})

// Mark patient as visited and assign token
router.post('/:id/visited', async (req, res) => {
  try {
    const { id } = req.params
    
    const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]) as any
    if (!appointment[0]) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    const apt = appointment[0]
    
    // Get the highest token number for today across all doctors
    const [maxToken] = await pool.query(
      `SELECT MAX(token_number) as max_token FROM appointments 
       WHERE DATE(date) = DATE(?) AND token_number IS NOT NULL`,
      [apt.date]
    ) as any
    
    const tokenNumber = (maxToken[0].max_token || 0) + 1
    
    await pool.query(
      'UPDATE appointments SET status = ?, token_number = ? WHERE id = ?',
      ['visited', tokenNumber, id]
    )
    
    await sendText(
      apt.phone,
      `🎫 Token Assigned!\n\n👤 Name: ${apt.patient_name}\n🎫 Token Number: ${tokenNumber}\n👨⚕️ Doctor: ${apt.doctor}\n🕐 Time Slot: ${apt.time_slot}\n\nPlease wait for your token to be called. Thank you! 🙏`
    )
    
    res.json({ success: true, message: 'Patient marked as visited', tokenNumber })
  } catch (error) {
    console.error('Error marking as visited:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark as completed
router.post('/:id/completed', async (req, res) => {
  try {
    const { id } = req.params
    
    const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]) as any
    if (!appointment[0]) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', ['completed', id])
    
    const apt = appointment[0]
    await sendText(
      apt.phone,
      `✅ Checkup Completed!\n\n👤 Name: ${apt.patient_name}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n\nYour checkup has been completed successfully. Thank you for visiting our hospital!\n\nIf you need any further assistance or have questions about your treatment, please feel free to contact us.\n\nTake care! 🙏`
    )
    
    res.json({ success: true, message: 'Checkup completed' })
  } catch (error) {
    console.error('Error marking as completed:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
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
    `⏰ Alternate Time Suggested\n\n👤 Name: ${apt.patient_name}\n🏥 Category: ${apt.category}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n\n❌ Requested: ${apt.time_slot}\n✅ Suggested: ${alternateSlot}\n\nThe requested time is not available. Please reply 'accept' to confirm the alternate time or 'reject' to cancel.`
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
  
  const apt = appointment[0]
  await sendText(
    apt.phone,
    `❌ Appointment Request Declined\n\n👤 Name: ${apt.patient_name}\n🏥 Category: ${apt.category}\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n🕐 Time: ${apt.time_slot}\n\nReason: ${reason}\n\nPlease contact the hospital or try booking again with a different time.`
  )
  
  res.json({ success: true, message: 'Appointment rejected' })
})

// Get categories
router.get('/categories', async (req, res) => {
  const categories = await getCategories()
  res.json({ categories })
})

// Create doctor
router.post('/doctors', async (req, res) => {
  const { name, categoryId } = req.body
  const [result] = await pool.query(
    'INSERT INTO doctors (name, category_id) VALUES (?, ?)',
    [name, categoryId]
  )
  res.json({ success: true, message: 'Doctor created' })
})

// Update doctor
router.put('/doctors/:id', async (req, res) => {
  const { id } = req.params
  const { name, categoryId } = req.body
  
  await pool.query(
    'UPDATE doctors SET name = ?, category_id = ? WHERE id = ?',
    [name, categoryId, id]
  )
  res.json({ success: true, message: 'Doctor updated' })
})

// Delete doctor
router.delete('/doctors/:id', async (req, res) => {
  const { id } = req.params
  await deleteDoctor(parseInt(id))
  res.json({ success: true, message: 'Doctor deleted' })
})

// Add time slot
router.post('/doctors/:doctorId/slots', async (req, res) => {
  const { doctorId } = req.params
  const { startTime, endTime, capacity, date } = req.body
  await pool.query(
    'INSERT INTO time_slots (doctor_id, start_time, end_time, capacity, date) VALUES (?, ?, ?, ?, STR_TO_DATE(?, "%Y-%m-%d"))',
    [doctorId, startTime, endTime, capacity, date || null]
  )
  res.json({ success: true, message: 'Time slot added' })
})

// Update time slot
router.put('/slots/:id', async (req, res) => {
  const { id } = req.params
  const { startTime, endTime, capacity } = req.body
  await pool.query(
    'UPDATE time_slots SET start_time = ?, end_time = ?, capacity = ? WHERE id = ?',
    [startTime, endTime, capacity, id]
  )
  res.json({ success: true, message: 'Time slot updated' })
})

// Delete time slot
router.delete('/slots/:id', async (req, res) => {
  const { id } = req.params
  await pool.query('DELETE FROM time_slots WHERE id = ?', [id])
  res.json({ success: true, message: 'Time slot deleted' })
})

export default router
