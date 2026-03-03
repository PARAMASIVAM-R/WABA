const mysql = require('mysql2/promise')

async function fixDates() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'WABA'
  })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  console.log('\n=== FIXING APPOINTMENT DATES ===')
  console.log('Today:', todayStr)
  console.log('Tomorrow:', tomorrowStr)

  // Update appointments with date = 'today'
  const [result1] = await pool.query(
    "UPDATE appointments SET date = ? WHERE date = 'today'",
    [todayStr]
  )
  console.log(`Updated ${result1.affectedRows} appointments from 'today' to ${todayStr}`)

  // Update appointments with date = 'tomorrow'
  const [result2] = await pool.query(
    "UPDATE appointments SET date = ? WHERE date = 'tomorrow'",
    [tomorrowStr]
  )
  console.log(`Updated ${result2.affectedRows} appointments from 'tomorrow' to ${tomorrowStr}`)

  // Show updated appointments
  const [all] = await pool.query('SELECT id, patient_name, date, status FROM appointments ORDER BY date')
  console.log('\n--- All appointments after fix ---')
  all.forEach(apt => {
    console.log(`ID: ${apt.id}, Patient: ${apt.patient_name}, Date: ${apt.date}, Status: ${apt.status}`)
  })

  console.log('\n================================\n')
  
  await pool.end()
}

fixDates().catch(console.error)
