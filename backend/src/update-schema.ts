import mysql from 'mysql2/promise'
import { env } from './config/env'

async function updateSchema() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔧 Updating database schema...')

  // Drop old tables
  await connection.query('DROP TABLE IF EXISTS appointments')
  await connection.query('DROP TABLE IF EXISTS time_slots')
  
  // Create new time_slots with 15-minute intervals
  await connection.query(`
    CREATE TABLE time_slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_id INT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    )
  `)
  
  // Create appointments with status and patient name
  await connection.query(`
    CREATE TABLE appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      patient_name VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      doctor VARCHAR(100) NOT NULL,
      date VARCHAR(50) NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      status ENUM('pending', 'accepted', 'rejected', 'alternate_suggested') DEFAULT 'pending',
      alternate_slot VARCHAR(50) NULL,
      rejection_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Insert 15-minute time slots for all doctors (9 AM - 5 PM)
  const [doctors] = await connection.query('SELECT id FROM doctors')
  
  for (const doctor of doctors as any[]) {
    const slots = [
      ['09:00:00', '09:15:00'], ['09:15:00', '09:30:00'], ['09:30:00', '09:45:00'], ['09:45:00', '10:00:00'],
      ['10:00:00', '10:15:00'], ['10:15:00', '10:30:00'], ['10:30:00', '10:45:00'], ['10:45:00', '11:00:00'],
      ['11:00:00', '11:15:00'], ['11:15:00', '11:30:00'], ['11:30:00', '11:45:00'], ['11:45:00', '12:00:00'],
      ['14:00:00', '14:15:00'], ['14:15:00', '14:30:00'], ['14:30:00', '14:45:00'], ['14:45:00', '15:00:00'],
      ['15:00:00', '15:15:00'], ['15:15:00', '15:30:00'], ['15:30:00', '15:45:00'], ['15:45:00', '16:00:00'],
      ['16:00:00', '16:15:00'], ['16:15:00', '16:30:00'], ['16:30:00', '16:45:00'], ['16:45:00', '17:00:00']
    ]
    
    for (const [start, end] of slots) {
      await connection.query(
        'INSERT INTO time_slots (doctor_id, start_time, end_time) VALUES (?, ?, ?)',
        [doctor.id, start, end]
      )
    }
  }

  console.log('✅ Schema updated with 15-minute slots')
  await connection.end()
}

updateSchema().catch(console.error)
