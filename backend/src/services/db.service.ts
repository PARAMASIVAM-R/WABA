import mysql from 'mysql2/promise'
import { env } from '../config/env'

const pool = mysql.createPool({
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
      TIME_FORMAT(start_time, '%h:%i %p') as time,
      start_time,
      end_time,
      is_booked
    FROM time_slots 
    WHERE doctor_id = ? AND is_booked = FALSE
    ORDER BY start_time
  `, [doctorId])
  return rows as any[]
}

export async function getAllTimeSlotsByDoctor(doctorId: number) {
  const [rows] = await pool.query(`
    SELECT 
      id,
      TIME_FORMAT(start_time, '%h:%i %p') as time,
      start_time,
      end_time,
      is_booked
    FROM time_slots 
    WHERE doctor_id = ?
    ORDER BY start_time
  `, [doctorId])
  return rows as any[]
}

export async function saveAppointment(phone: string, patientName: string, category: string, doctor: string, date: string, timeSlot: string, timeSlotId: number) {
  const [result] = await pool.query(
    'INSERT INTO appointments (phone, patient_name, category, doctor, date, time_slot, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [phone, patientName, category, doctor, date, timeSlot, 'pending']
  )
  
  // Mark time slot as booked
  await pool.query(
    'UPDATE time_slots SET is_booked = TRUE WHERE id = ?',
    [timeSlotId]
  )
  
  console.log('💾 Appointment saved and time slot marked as booked')
  return result
}

export async function getAppointments() {
  const [rows] = await pool.query('SELECT * FROM appointments ORDER BY created_at DESC')
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
  await pool.query(
    'UPDATE followups SET status = "sent", sent_at = NOW() WHERE id = ?',
    [id]
  )
}
