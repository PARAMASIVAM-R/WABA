import mysql from 'mysql2/promise'
import { env } from './config/env'

async function clearDatabase() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🗑️  Clearing all data from database...')

  await connection.query('DELETE FROM appointments')
  await connection.query('DELETE FROM time_slots')
  await connection.query('DELETE FROM doctors')
  await connection.query('DELETE FROM categories')

  console.log('✅ All data cleared successfully')
  await connection.end()
}

clearDatabase().catch(console.error)
