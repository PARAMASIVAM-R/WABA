import mysql from 'mysql2/promise'
import { env } from '../config/env'

export const pool = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10
})

export async function initDB() {
  const connection = await pool.getConnection()
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    )
  `)
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category_id INT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_id INT NOT NULL,
      time VARCHAR(20) NOT NULL,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `)
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      doctor VARCHAR(100) NOT NULL,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  connection.release()
  console.log('✅ Database initialized')
}

export async function getCategories() {
  const [rows] = await pool.query('SELECT * FROM categories')
  return rows as any[]
}

export async function getDoctorsByCategory(categoryId: number) {
  const [rows] = await pool.query('SELECT * FROM doctors WHERE category_id = ?', [categoryId])
  return rows as any[]
}

export async function getTimeSlotsByDoctor(doctorId: number) {
  const [rows] = await pool.query(`
    SELECT 
      id,
      slot_date,
      TIME_FORMAT(start_time, '%h:%i %p') as time,
      start_time,
      end_time,
      is_booked
    FROM time_slots 
    WHERE doctor_id = ? AND is_booked = FALSE AND slot_date >= CURDATE()
    ORDER BY slot_date, start_time
  `, [doctorId])
  return rows as any[]
}

export async function getAllTimeSlotsByDoctor(doctorId: number) {
  const [rows] = await pool.query(`
    SELECT 
      id,
      slot_date,
      TIME_FORMAT(start_time, '%h:%i %p') as time,
      start_time,
      end_time,
      is_booked
    FROM time_slots 
    WHERE doctor_id = ? AND slot_date >= CURDATE()
    ORDER BY slot_date, start_time
    LIMIT 16
  `, [doctorId])
  return rows as any[]
}

export async function saveAppointment(phone: string, patientName: string, category: string, doctor: string, date: string, timeSlot: string, timeSlotId: number) {
  const [result] = await pool.query(
    `INSERT INTO appointments (phone, patient_name, category, doctor, date, time_slot, status) VALUES (?, ?, ?, ?, '${date}', ?, ?)`,
    [phone, patientName, category, doctor, timeSlot, 'confirmed']
  )
  
  console.log('💾 Appointment saved with confirmed status')
  return result
}


export async function getAppointments() {
  const [rows] = await pool.query(`
    SELECT 
      id,
      phone,
      patient_name,
      category,
      doctor,
      DATE_FORMAT(date, '%Y-%m-%d') as date,
      time_slot,
      status,
      token_number,
      created_at
    FROM appointments 
    ORDER BY 
      date DESC,
      created_at DESC,
      CASE status
        WHEN 'confirmed' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'visited' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'cancelled' THEN 5
        ELSE 6
      END
  `)
  return rows
}

export async function getAppointmentsByPhone(phone: string) {
  const [rows] = await pool.query('SELECT * FROM appointments WHERE phone = ? ORDER BY created_at DESC', [phone])
  return rows
}

// Followup functions
export async function createFollowup(phone: string, patientName: string | null, messageType: 'custom' | 'template', templateName: string | null, customMessage: string | null) {
  const [result] = await pool.query(
    'INSERT INTO followups (phone, patient_name, message_type, template_name, custom_message) VALUES (?, ?, ?, ?, ?)',
    [phone, patientName, messageType, templateName, customMessage]
  )
  return result
}

export async function getFollowups() {
  const [rows] = await pool.query('SELECT * FROM followups ORDER BY created_at DESC')
  return rows
}

export async function markFollowupAsSent(id: number) {
  console.log(`Marking followup ${id} as sent`)
  const [result] = await pool.query(
    'UPDATE followups SET status = "sent", sent_at = NOW() WHERE id = ?',
    [id]
  ) as any
  console.log(`Updated ${result.affectedRows} rows`)
  return result
}

// Doctor management functions
export async function createDoctor(name: string, categoryId: number) {
  const [result] = await pool.query(
    'INSERT INTO doctors (name, category_id) VALUES (?, ?)',
    [name, categoryId]
  )
  return result
}

export async function updateDoctor(id: number, name: string, categoryId: number) {
  await pool.query(
    'UPDATE doctors SET name = ?, category_id = ? WHERE id = ?',
    [name, categoryId, id]
  )
}

export async function deleteDoctor(id: number) {
  await pool.query('DELETE FROM time_slots WHERE doctor_id = ?', [id])
  await pool.query('DELETE FROM doctors WHERE id = ?', [id])
}

export async function createTimeSlot(doctorId: number, startTime: string, endTime: string) {
  // Create slot for next 7 days
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const slotDate = new Date(today)
    slotDate.setDate(today.getDate() + i)
    const dateStr = slotDate.toISOString().split('T')[0]
    
    await pool.query(
      'INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time) VALUES (?, ?, ?, ?)',
      [doctorId, dateStr, startTime, endTime]
    )
  }
}

export async function deleteTimeSlot(id: number) {
  await pool.query('DELETE FROM time_slots WHERE id = ?', [id])
}
