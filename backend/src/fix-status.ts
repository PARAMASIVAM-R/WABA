import mysql from 'mysql2/promise'
import { env } from './config/env'

async function fixStatus() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔄 Fixing appointments status column...')

  try {
    await connection.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'
    `)
    console.log('✅ Status column updated to VARCHAR')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await connection.end()
  }
}

fixStatus()
