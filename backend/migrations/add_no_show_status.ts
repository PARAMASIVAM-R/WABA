import mysql from 'mysql2/promise'
import { env } from '../src/config/env'

async function migrate() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔧 Adding no_show status...')

  await connection.query(`
    ALTER TABLE appointments 
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'accepted', 'visited', 'completed', 'cancelled', 'rejected', 'alternate_suggested', 'no_show') DEFAULT 'confirmed'
  `)

  console.log('✅ Migration complete!')
  await connection.end()
}

migrate().catch(console.error)
