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
  
  // Create new time_slots with 15-minute intervals and availability
  await connection.query(`
    CREATE TABLE time_slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_id INT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      date DATE NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      UNIQUE KEY unique_slot (doctor_id, date, start_time)
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

  // Insert 15-minute time slots for all doctors (only 2 hours: 9 AM - 11 AM)
  const [doctors] = await connection.query('SELECT id FROM doctors')
  
  // Generate slots for next 30 days
  const today = new Date()
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset)
    const dateStr = date.toISOString().split('T')[0]
    
    for (const doctor of doctors as any[]) {
      const slots = [
        ['09:00:00', '09:15:00'], ['09:15:00', '09:30:00'], ['09:30:00', '09:45:00'], ['09:45:00', '10:00:00'],
        ['10:00:00', '10:15:00'], ['10:15:00', '10:30:00'], ['10:30:00', '10:45:00'], ['10:45:00', '11:00:00']
      ]
      
      for (const [start, end] of slots) {
        await connection.query(
          'INSERT INTO time_slots (doctor_id, start_time, end_time, date, is_available) VALUES (?, ?, ?, ?, TRUE)',
          [doctor.id, start, end, dateStr]
        )
      }
    }
  }

  console.log('✅ Schema updated with 15-minute slots')
  await connection.end()
}

updateSchema().catch(console.error)
