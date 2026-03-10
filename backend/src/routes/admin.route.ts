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
    'SELECT id, doctor_id, start_time, end_time, capacity, DATE_FORMAT(date, "%Y-%m-%d") as date, COALESCE(is_available, 1) as is_available, created_at FROM time_slots WHERE doctor_id = ? ORDER BY date, start_time',
    [doctorId]
  ) as any
  
  const [appointments] = await pool.query(
    `SELECT id, patient_name, phone, DATE_FORMAT(date, '%Y-%m-%d') as date, time_slot, status, token_number, created_at
     FROM appointments 
     WHERE doctor = ? AND status IN ('confirmed', 'pending', 'accepted', 'visited', 'completed', 'cancelled_by_hospital', 'doctor_not_available', 'no_show')
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
    const [allRows] = await pool.query('SELECT id, patient_name, DATE_FORMAT(date, "%Y-%m-%d") as formatted_date, date, status FROM appointments ORDER BY date DESC LIMIT 10') as any
    console.log('Recent appointments in DB:', allRows)
    
    const [rows] = await pool.query(`
      SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as formatted_date FROM appointments 
      WHERE DATE_FORMAT(date, '%Y-%m-%d') = ? AND status IN ('active', 'confirmed', 'accepted', 'visited', 'completed', 'no_show')
      ORDER BY doctor, time_slot, token_number
    `, [todayStr]) as any
    
    console.log('Matching today visits:', rows.length)
    console.log('Sample appointment:', rows[0])
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

// Mark as not visited (no-show)
router.post('/:id/no-show', async (req, res) => {
  try {
    const { id } = req.params
    
    const [appointment] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]) as any
    if (!appointment[0]) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', ['no_show', id])
    
    const apt = appointment[0]
    await sendText(
      apt.phone,
      `⚠️ Missed Appointment Notice\n\nHello ${apt.patient_name},\n\nYou missed your appointment today:\n👨⚕️ Doctor: ${apt.doctor}\n🕐 Time: ${apt.time_slot}\n\nThis appointment slot has now passed. If you still need medical consultation, please book a new appointment.\n\n💡 To book a new appointment, type:\n• "hi" or "hello" or "book"\n\nThank you!`
    )
    
    res.json({ success: true, message: 'Marked as no-show and message sent' })
  } catch (error) {
    console.error('Error marking as no-show:', error)
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
    'INSERT INTO time_slots (doctor_id, start_time, end_time, capacity, date) VALUES (?, ?, ?, ?, ?)',
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

// Mark slot as not available
router.post('/slots/:id/not-available', async (req, res) => {
  try {
    const { id } = req.params
    
    const [slot] = await pool.query(
      'SELECT ts.*, d.name as doctor_name FROM time_slots ts JOIN doctors d ON ts.doctor_id = d.id WHERE ts.id = ?',
      [id]
    ) as any
    
    if (!slot[0]) {
      return res.status(404).json({ error: 'Time slot not found' })
    }
    
    const slotInfo = slot[0]
    const slotDate = slotInfo.date ? new Date(slotInfo.date).toISOString().split('T')[0] : null
    
    if (!slotDate) {
      return res.status(400).json({ error: 'Invalid slot date' })
    }
    
    // Mark slot as unavailable
    await pool.query('UPDATE time_slots SET is_available = 0 WHERE id = ?', [id])
    
    const formatTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h || '0')
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const mins = m === '00' ? '' : `:${m}`
      return `${hour12}${mins}${ampm}`
    }
    
    const slotTime = `${formatTime(slotInfo.start_time)} - ${formatTime(slotInfo.end_time)}`
    
    const [appointments] = await pool.query(
      `SELECT * FROM appointments 
       WHERE doctor = ? AND status IN ('confirmed', 'accepted', 'pending')`,
      [slotInfo.doctor_name]
    ) as any
    
    const dateFilteredAppointments = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      return aptDate === slotDate
    })
    
    const affectedAppointments = dateFilteredAppointments.filter((apt: any) => {
      const aptTime = apt.time_slot.replace(/\s*\[\d+\/\d+\]\s*$/, '').replace(/\s+/g, '').toUpperCase()
      const slotTimeNorm = slotTime.replace(/\s+/g, '').toUpperCase()
      return aptTime === slotTimeNorm
    })
    
    for (const apt of affectedAppointments) {
      await pool.query(
        'UPDATE appointments SET status = ? WHERE id = ?',
        ['doctor_not_available', apt.id]
      )
      
      await sendText(
        apt.phone,
        `⚠️ Doctor Not Available\n\nHello ${apt.patient_name},\n\nUnfortunately, the doctor is not available for your appointment:\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n🕐 Time: ${apt.time_slot}\n\nPlease book another slot at your convenience.\n\n💡 To book a new appointment, type:\n• "hi" or "hello" or "book"\n\nWe apologize for the inconvenience. Thank you for your understanding! 🙏`
      )
    }
    
    res.json({ 
      success: true, 
      message: 'Patients notified about doctor unavailability', 
      notifiedPatients: affectedAppointments.length 
    })
  } catch (error) {
    console.error('Error marking slot as not available:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark slot as not available
router.post('/slots/:id/not-available', async (req, res) => {
  try {
    const { id } = req.params
    
    const [slot] = await pool.query(
      'SELECT ts.*, d.name as doctor_name FROM time_slots ts JOIN doctors d ON ts.doctor_id = d.id WHERE ts.id = ?',
      [id]
    ) as any
    
    if (!slot[0]) {
      return res.status(404).json({ error: 'Time slot not found' })
    }
    
    const slotInfo = slot[0]
    const slotDate = slotInfo.date ? new Date(slotInfo.date).toISOString().split('T')[0] : null
    
    if (!slotDate) {
      return res.status(400).json({ error: 'Invalid slot date' })
    }
    
    const formatTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h || '0')
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const mins = m === '00' ? '' : `:${m}`
      return `${hour12}${mins}${ampm}`
    }
    
    const slotTime = `${formatTime(slotInfo.start_time)} - ${formatTime(slotInfo.end_time)}`
    
    const [appointments] = await pool.query(
      `SELECT * FROM appointments 
       WHERE doctor = ? AND status IN ('confirmed', 'accepted', 'pending')`,
      [slotInfo.doctor_name]
    ) as any
    
    const dateFilteredAppointments = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      return aptDate === slotDate
    })
    
    const affectedAppointments = dateFilteredAppointments.filter((apt: any) => {
      const aptTime = apt.time_slot.replace(/\s*\[\d+\/\d+\]\s*$/, '').replace(/\s+/g, '').toUpperCase()
      const slotTimeNorm = slotTime.replace(/\s+/g, '').toUpperCase()
      return aptTime === slotTimeNorm
    })
    
    for (const apt of affectedAppointments) {
      await pool.query(
        'UPDATE appointments SET status = ? WHERE id = ?',
        ['doctor_not_available', apt.id]
      )
      
      await sendText(
        apt.phone,
        `⚠️ Doctor Not Available\n\nHello ${apt.patient_name},\n\nUnfortunately, the doctor is not available for your appointment:\n👨‍⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n🕐 Time: ${apt.time_slot}\n\nPlease book another slot at your convenience.\n\n💡 To book a new appointment, type:\n• "hi" or "hello" or "book"\n\nWe apologize for the inconvenience. Thank you for your understanding! 🙏`
      )
    }
    
    res.json({ 
      success: true, 
      message: 'Patients notified about doctor unavailability', 
      notifiedPatients: affectedAppointments.length 
    })
  } catch (error) {
    console.error('Error marking slot as not available:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete time slot
router.delete('/slots/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    console.log('\n=== DELETING SLOT ===')
    console.log('Slot ID:', id)
    
    // Get slot details first
    const [slot] = await pool.query(
      'SELECT ts.*, d.name as doctor_name FROM time_slots ts JOIN doctors d ON ts.doctor_id = d.id WHERE ts.id = ?',
      [id]
    ) as any
    
    if (!slot[0]) {
      return res.status(404).json({ error: 'Time slot not found' })
    }
    
    const slotInfo = slot[0]
    console.log('Slot Info:', slotInfo)
    
    // Format date properly
    const slotDate = slotInfo.date ? new Date(slotInfo.date).toISOString().split('T')[0] : null
    console.log('Formatted slot date:', slotDate)
    
    if (!slotDate) {
      return res.status(400).json({ error: 'Invalid slot date' })
    }
    
    // Format time for matching
    const formatTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h || '0')
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const mins = m === '00' ? '' : `:${m}`
      return `${hour12}${mins}${ampm}`
    }
    
    const slotTime = `${formatTime(slotInfo.start_time)} - ${formatTime(slotInfo.end_time)}`
    console.log('Formatted slot time:', slotTime)
    
    // Find all appointments in this slot
    const [appointments] = await pool.query(
      `SELECT * FROM appointments 
       WHERE doctor = ? AND status IN ('confirmed', 'accepted', 'pending')`,
      [slotInfo.doctor_name]
    ) as any
    
    // Filter by date manually to handle timezone issues
    const dateFilteredAppointments = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      console.log(`Comparing dates: apt=${aptDate} vs slot=${slotDate}`)
      return aptDate === slotDate
    })
    
    console.log('Found appointments:', appointments.length)
    console.log('Date filtered appointments:', dateFilteredAppointments.length)
    console.log('Appointments:', dateFilteredAppointments)
    
    // Filter appointments that match this time slot
    const affectedAppointments = dateFilteredAppointments.filter((apt: any) => {
      const aptTime = apt.time_slot.replace(/\s*\[\d+\/\d+\]\s*$/, '').replace(/\s+/g, '').toUpperCase()
      const slotTimeNorm = slotTime.replace(/\s+/g, '').toUpperCase()
      console.log(`Comparing: "${aptTime}" === "${slotTimeNorm}"`)
      return aptTime === slotTimeNorm
    })
    
    console.log('Affected appointments:', affectedAppointments.length)
    
    // Cancel all affected appointments and notify patients
    for (const apt of affectedAppointments) {
      console.log(`Cancelling appointment ${apt.id} for ${apt.patient_name} (${apt.phone})`)
      
      await pool.query(
        'UPDATE appointments SET status = ? WHERE id = ?',
        ['cancelled_by_hospital', apt.id]
      )
      
      await sendText(
        apt.phone,
        `❌ Appointment Cancelled by Hospital\n\nHello ${apt.patient_name},\n\nYour appointment has been cancelled by the hospital:\n👨⚕️ Doctor: ${apt.doctor}\n📅 Date: ${formatDate(apt.date)}\n🕐 Time: ${apt.time_slot}\n\nReason: Time slot removed by hospital\n\n💡 To book a new appointment, type:\n• "hi" or "hello" or "book"\n\nWe apologize for the inconvenience.`
      )
    }
    
    // Delete the time slot
    await pool.query('DELETE FROM time_slots WHERE id = ?', [id])
    
    console.log('Slot deleted successfully')
    console.log('===========================\n')
    
    res.json({ 
      success: true, 
      message: 'Time slot deleted', 
      notifiedPatients: affectedAppointments.length 
    })
  } catch (error) {
    console.error('Error deleting slot:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Make slot available again
router.post('/slots/:id/make-available', async (req, res) => {
  try {
    const { id } = req.params
    
    const [slot] = await pool.query(
      'SELECT ts.*, d.name as doctor_name FROM time_slots ts JOIN doctors d ON ts.doctor_id = d.id WHERE ts.id = ?',
      [id]
    ) as any
    
    if (!slot[0]) {
      return res.status(404).json({ error: 'Time slot not found' })
    }
    
    const slotInfo = slot[0]
    const slotDate = slotInfo.date ? new Date(slotInfo.date).toISOString().split('T')[0] : null
    
    if (!slotDate) {
      return res.status(400).json({ error: 'Invalid slot date' })
    }
    
    // Mark slot as available
    await pool.query('UPDATE time_slots SET is_available = 1 WHERE id = ?', [id])
    
    const formatTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h || '0')
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const mins = m === '00' ? '' : `:${m}`
      return `${hour12}${mins}${ampm}`
    }
    
    const slotTime = `${formatTime(slotInfo.start_time)} - ${formatTime(slotInfo.end_time)}`
    
    const [appointments] = await pool.query(
      `SELECT * FROM appointments 
       WHERE doctor = ? AND status IN ('doctor_not_available', 'cancelled_by_hospital')`,
      [slotInfo.doctor_name]
    ) as any
    
    const dateFilteredAppointments = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0]
      return aptDate === slotDate
    })
    
    const affectedAppointments = dateFilteredAppointments.filter((apt: any) => {
      const aptTime = apt.time_slot.replace(/\s*\[\d+\/\d+\]\s*$/, '').replace(/\s+/g, '').toUpperCase()
      const slotTimeNorm = slotTime.replace(/\s+/g, '').toUpperCase()
      return aptTime === slotTimeNorm
    })
    
    for (const apt of affectedAppointments) {
      await pool.query('DELETE FROM appointments WHERE id = ?', [apt.id])
    }
    
    res.json({ 
      success: true, 
      message: 'Slot made available and patients removed', 
      removedPatients: affectedAppointments.length 
    })
  } catch (error) {
    console.error('Error making slot available:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
