require('dotenv').config()
const mysql = require('mysql2/promise')

async function resetAppointments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🗑️  Clearing appointments...')
    await connection.query('DELETE FROM appointments')
    console.log('✅ All appointments deleted')
    
    console.log('\n📊 Current database state:')
    
    const [categories] = await connection.query('SELECT * FROM categories')
    console.log(`\n✅ Categories (${categories.length}):`)
    categories.forEach(c => console.log(`   - ${c.name}`))
    
    const [doctors] = await connection.query('SELECT d.name, c.name as category FROM doctors d JOIN categories c ON d.category_id = c.id')
    console.log(`\n✅ Doctors (${doctors.length}):`)
    doctors.forEach(d => console.log(`   - ${d.name} (${d.category})`))
    
    console.log('\n✅ Database reset complete! Ready for testing token system.')
    console.log('📝 Token numbers will now start from 1 and increment in order.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

resetAppointments()
