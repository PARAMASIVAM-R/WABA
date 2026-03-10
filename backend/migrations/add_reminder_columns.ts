import mysql from 'mysql2/promise'
import { env } from '../config/env'

async function addReminderColumns() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  try {
    await connection.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS day_reminder_sent TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hour_reminder_sent TINYINT(1) DEFAULT 0
    `)
    console.log('✅ Added day_reminder_sent and hour_reminder_sent columns to appointments table')
  } catch (error) {
    console.error('❌ Error adding reminder columns:', error)
  } finally {
    await connection.end()
  }
}

addReminderColumns()
