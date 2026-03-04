const mysql = require('mysql2/promise')

async function addCapacity() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'WABA'
  })

  console.log('Adding capacity_per_slot column to doctors table...')
  
  try {
    await pool.query('ALTER TABLE doctors ADD COLUMN capacity_per_slot INT DEFAULT 5 AFTER slots_per_day')
    console.log('✅ Successfully added capacity_per_slot column')
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ Column already exists')
    } else {
      throw error
    }
  }

  const [doctors] = await pool.query('SELECT id, name, capacity_per_slot FROM doctors')
  console.log('\nDoctors with capacity:')
  doctors.forEach(d => console.log(`  ${d.name}: capacity = ${d.capacity_per_slot}`))

  await pool.end()
}

addCapacity().catch(console.error)
