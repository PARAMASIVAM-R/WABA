import mysql from 'mysql2/promise'
import { env } from './config/env'

async function updateDoctorSchema() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔄 Updating doctor schema...')

  try {
    // Check if end_time column exists
    const [cols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'doctors'",
      [env.dbName]
    ) as any
    
    const colNames = cols.map((c: any) => c.COLUMN_NAME)
    
    // Add end_time if not exists
    if (!colNames.includes('end_time')) {
      await connection.query("ALTER TABLE doctors ADD COLUMN end_time TIME DEFAULT '17:00:00'")
      console.log('✅ Added end_time column')
    }
    
    // Drop patients_per_slot if exists
    if (colNames.includes('patients_per_slot')) {
      await connection.query('ALTER TABLE doctors DROP COLUMN patients_per_slot')
      console.log('✅ Removed patients_per_slot column')
    }

    console.log('\n✅ Migration completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await connection.end()
  }
}

updateDoctorSchema()
