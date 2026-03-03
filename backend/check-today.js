const mysql = require('mysql2/promise')

async function checkToday() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'WABA'
  })

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  console.log('\n=== CHECKING TODAY\'S APPOINTMENTS ===')
  console.log('Today\'s date:', todayStr)
  console.log('Day of week:', today.toLocaleDateString('en-US', { weekday: 'long' }))
  
  // Check all appointments
  const [all] = await pool.query('SELECT id, patient_name, date, status FROM appointments ORDER BY date DESC LIMIT 20')
  console.log('\n--- Last 20 appointments in database ---')
  all.forEach(apt => {
    console.log(`ID: ${apt.id}, Patient: ${apt.patient_name}, Date: ${apt.date}, Status: ${apt.status}`)
  })

  // Check today's appointments
  const [today1] = await pool.query('SELECT * FROM appointments WHERE date = ?', [todayStr])
  console.log(`\n--- Appointments with date = '${todayStr}' ---`)
  console.log('Count:', today1.length)
  today1.forEach(apt => {
    console.log(`ID: ${apt.id}, Patient: ${apt.patient_name}, Status: ${apt.status}, Token: ${apt.token_number}`)
  })

  // Check with DATE() function
  const [today2] = await pool.query('SELECT * FROM appointments WHERE DATE(date) = ?', [todayStr])
  console.log(`\n--- Appointments with DATE(date) = '${todayStr}' ---`)
  console.log('Count:', today2.length)
  today2.forEach(apt => {
    console.log(`ID: ${apt.id}, Patient: ${apt.patient_name}, Status: ${apt.status}, Token: ${apt.token_number}`)
  })

  // Check accepted/visited/completed for today
  const [today3] = await pool.query(
    "SELECT * FROM appointments WHERE DATE(date) = ? AND status IN ('accepted', 'visited', 'completed')",
    [todayStr]
  )
  console.log(`\n--- Today's accepted/visited/completed appointments ---`)
  console.log('Count:', today3.length)
  today3.forEach(apt => {
    console.log(`ID: ${apt.id}, Patient: ${apt.patient_name}, Status: ${apt.status}, Token: ${apt.token_number}`)
  })

  console.log('\n=====================================\n')
  
  await pool.end()
}

checkToday().catch(console.error)
