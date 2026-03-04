const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSlots() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_appointment'
  });

  try {
    const [rows] = await connection.query('SELECT * FROM time_slots WHERE doctor_id = 3');
    console.log('Time slots in DB:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSlots();
