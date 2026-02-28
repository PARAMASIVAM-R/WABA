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
  await connection.query(`
    INSERT INTO categories (name) VALUES 
    ('General Medicine'),
    ('Cardiology'),
    ('Dermatology'),
    ('Pediatrics'),
    ('Orthopedics')
  `)

  // Insert doctors
  await connection.query(`
    INSERT INTO doctors (name, category_id) VALUES 
    ('Dr. John Smith', 1),
    ('Dr. Sarah Johnson', 1),
    ('Dr. Michael Brown', 2),
    ('Dr. Emily Davis', 2),
    ('Dr. David Wilson', 3),
    ('Dr. Lisa Anderson', 4),
    ('Dr. Robert Taylor', 5)
  `)

  // Insert time slots for all doctors
  const [doctors] = await connection.query('SELECT id FROM doctors')
  for (const doctor of doctors as any[]) {
    await connection.query(`
      INSERT INTO time_slots (doctor_id, time) VALUES 
      (?, '9:00 AM'),
      (?, '10:00 AM'),
      (?, '11:00 AM'),
      (?, '2:00 PM'),
      (?, '3:00 PM'),
      (?, '4:00 PM')
    `, [doctor.id, doctor.id, doctor.id, doctor.id, doctor.id, doctor.id])
  }

  console.log('✅ Seed data inserted successfully')
  await connection.end()
}

seedData().catch(console.error)
