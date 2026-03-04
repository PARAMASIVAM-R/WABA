import mysql from 'mysql2/promise'
import { env } from './config/env'

async function migrate() {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  })

  console.log('🔄 Starting migration to new slot system...')

  try {
    // Check and add columns to doctors table
    const [doctorCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'doctors'",
      [env.dbName]
    ) as any
    
    const doctorColNames = doctorCols.map((c: any) => c.COLUMN_NAME)
    
    if (!doctorColNames.includes('slots_per_day')) {
      await connection.query('ALTER TABLE doctors ADD COLUMN slots_per_day INT DEFAULT 4')
    }
    if (!doctorColNames.includes('patients_per_slot')) {
      await connection.query('ALTER TABLE doctors ADD COLUMN patients_per_slot INT DEFAULT 5')
    }
    if (!doctorColNames.includes('start_time')) {
      await connection.query("ALTER TABLE doctors ADD COLUMN start_time TIME DEFAULT '09:00:00'")
    }
    console.log('✅ Updated doctors table')

    // Check and add token_number to appointments table
    const [aptCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments'",
      [env.dbName]
    ) as any
    
    const aptColNames = aptCols.map((c: any) => c.COLUMN_NAME)
    
    if (!aptColNames.includes('token_number')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN token_number INT DEFAULT NULL')
    }
    console.log('✅ Updated appointments table')

    // Drop time_slots table if exists
    await connection.query('DROP TABLE IF EXISTS time_slots')
    console.log('✅ Removed old time_slots table')

    // Update existing doctors with default values
    await connection.query(`
      UPDATE doctors 
      SET slots_per_day = 4, patients_per_slot = 5, start_time = '09:00:00'
      WHERE slots_per_day IS NULL OR patients_per_slot IS NULL OR start_time IS NULL
    `)
    console.log('✅ Updated existing doctors with default values')

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   - Added slots_per_day, patients_per_slot, start_time to doctors table')
    console.log('   - Added token_number to appointments table')
    console.log('   - Removed time_slots table')
    console.log('   - Updated existing doctors with default values')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
  } finally {
    await connection.end()
  }
}

migrate()
