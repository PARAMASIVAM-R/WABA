import mysql from 'mysql2/promise'
import { env } from './config/env'

async function fixTable() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔧 Fixing appointments table...')

  await connection.query('DROP TABLE IF EXISTS appointments')
  
  await connection.query(`
    CREATE TABLE appointments (
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

  console.log('✅ Table fixed')
  await connection.end()
}

fixTable().catch(console.error)
