const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDateColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_appointment'
  });

  try {
    await connection.query('ALTER TABLE time_slots ADD COLUMN date DATE NULL');
    console.log('✅ Successfully added date column to time_slots table');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Date column already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await connection.end();
  }
}

addDateColumn();
