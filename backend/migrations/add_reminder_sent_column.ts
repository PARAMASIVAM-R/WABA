import mysql from 'mysql2/promise'
import { env } from '../config/env'

async function addReminderSentColumn() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  try {
    await connection.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS reminder_sent TINYINT(1) DEFAULT 0
    `)
    console.log('✅ Added reminder_sent column to appointments table')
  } catch (error) {
    console.error('❌ Error adding reminder_sent column:', error)
  } finally {
    await connection.end()
  }
}

addReminderSentColumn()
