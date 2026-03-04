import mysql from 'mysql2/promise'
import { env } from './config/env'

async function migrateToSessions() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔧 Migrating to capacity-based sessions...')

  // Disable foreign key checks
  await connection.query('SET FOREIGN_KEY_CHECKS = 0')

  // Drop old tables
  await connection.query('DROP TABLE IF EXISTS followups')
  await connection.query('DROP TABLE IF EXISTS appointments')
  await connection.query('DROP TABLE IF EXISTS bookings')
  await connection.query('DROP TABLE IF EXISTS time_slots')
  await connection.query('DROP TABLE IF EXISTS session_windows')
  await connection.query('DROP TABLE IF EXISTS doctors')
  await connection.query('DROP TABLE IF EXISTS categories')

  // Re-enable foreign key checks
  await connection.query('SET FOREIGN_KEY_CHECKS = 1')

  // Create categories
  await connection.query(`
    CREATE TABLE categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    )
  `)

  // Create doctors
  await connection.query(`
    CREATE TABLE doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category_id INT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)

  // Create session windows (replaces time_slots)
  await connection.query(`
    CREATE TABLE session_windows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_id INT NOT NULL,
      slot_date DATE NOT NULL,
      start_time TIME NOT NULL,
      capacity INT NOT NULL DEFAULT 5,
      booked_count INT NOT NULL DEFAULT 0,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      UNIQUE KEY unique_session (doctor_id, slot_date, start_time)
    )
  `)

  // Create bookings (replaces appointments)
  await connection.query(`
    CREATE TABLE bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      patient_name VARCHAR(100) NOT NULL,
      token_id VARCHAR(50) NOT NULL UNIQUE,
      window_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'rejected', 'visited') DEFAULT 'pending',
      rejection_reason TEXT NULL,
      visited_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (window_id) REFERENCES session_windows(id),
      INDEX idx_token (token_id),
      INDEX idx_status (status),
      INDEX idx_date (created_at)
    )
  `)

  // Create followups
  await connection.query(`
    CREATE TABLE followups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      patient_name VARCHAR(100) NULL,
      message_type ENUM('custom', 'template') DEFAULT 'custom',
      template_name VARCHAR(100) NULL,
      custom_message TEXT NULL,
      status ENUM('pending', 'sent') DEFAULT 'pending',
      sent_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ Tables created')

  // Insert categories
  await connection.query(`
    INSERT INTO categories (name) VALUES 
    ('General Medicine'),
    ('Cardiology'),
    ('Dermatology'),
    ('Pediatrics'),
    ('Orthopedics')
  `)

  const [categories] = await connection.query('SELECT id FROM categories ORDER BY id')
  const catIds = (categories as any[]).map(c => c.id)

  // Insert doctors
  await connection.query(`
    INSERT INTO doctors (name, category_id) VALUES 
    ('Dr. John Smith', ?),
    ('Dr. Sarah Johnson', ?),
    ('Dr. Michael Brown', ?),
    ('Dr. Emily Davis', ?),
    ('Dr. David Wilson', ?)
  `, [catIds[0], catIds[1], catIds[2], catIds[3], catIds[4]])

  // Create session windows for next 7 days
  const [doctors] = await connection.query('SELECT id FROM doctors')
  const today = new Date()
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const slotDate = new Date(today)
    slotDate.setDate(today.getDate() + dayOffset)
    const dateStr = slotDate.toISOString().split('T')[0]
    
    for (const doctor of doctors as any[]) {
      // Morning session: 10:00 AM, capacity 5
      await connection.query(
        'INSERT INTO session_windows (doctor_id, slot_date, start_time, capacity) VALUES (?, ?, ?, ?)',
        [doctor.id, dateStr, '10:00:00', 5]
      )
      
      // Afternoon session: 14:00 PM, capacity 5
      await connection.query(
        'INSERT INTO session_windows (doctor_id, slot_date, start_time, capacity) VALUES (?, ?, ?, ?)',
        [doctor.id, dateStr, '14:00:00', 5]
      )
    }
  }

  console.log('✅ Migration complete!')
  console.log('📊 Created:')
  console.log('   - 5 categories')
  console.log('   - 5 doctors')
  console.log('   - 2 sessions per doctor per day (10:00 AM & 2:00 PM)')
  console.log('   - Each session has capacity of 5 patients')
  console.log('   - 7 days of sessions (70 total sessions)')
  
  await connection.end()
}

migrateToSessions().catch(console.error)
