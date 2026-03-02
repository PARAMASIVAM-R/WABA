import mysql from 'mysql2/promise'
import { env } from './config/env'

async function seedData() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🌱 Seeding data...')

  // Check if data already exists
  const [existing] = await connection.query('SELECT COUNT(*) as count FROM categories')
  if ((existing as any)[0].count > 0) {
    console.log('✅ Data already exists, skipping seed')
    await connection.end()
    return
  }

  // Insert categories
  const [result] = await connection.query(`
    INSERT INTO categories (name) VALUES 
    ('General Medicine'),
    ('Cardiology'),
    ('Dermatology'),
    ('Pediatrics'),
    ('Orthopedics')
  `)

  // Get inserted category IDs
  const [categories] = await connection.query('SELECT id FROM categories ORDER BY id')
  const catIds = (categories as any[]).map(c => c.id)

  // Insert doctors
  await connection.query(`
    INSERT INTO doctors (name, category_id) VALUES 
    ('Dr. John Smith', ?),
    ('Dr. Sarah Johnson', ?),
    ('Dr. Michael Brown', ?),
    ('Dr. Emily Davis', ?),
    ('Dr. David Wilson', ?),
    ('Dr. Lisa Anderson', ?),
    ('Dr. Robert Taylor', ?)
  `, [catIds[0], catIds[0], catIds[1], catIds[1], catIds[2], catIds[3], catIds[4]])

  // Insert time slots for all doctors (15-minute intervals, 9 AM - 5 PM)
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

  console.log('✅ Seed data inserted successfully')
  await connection.end()
}

seedData().catch(console.error)
