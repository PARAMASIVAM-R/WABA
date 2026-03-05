const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_appointment'
  });

  try {
    // Clear all data
    await connection.query('DELETE FROM appointments');
    await connection.query('DELETE FROM time_slots');
    await connection.query('DELETE FROM doctors');
    await connection.query('DELETE FROM categories');
    await connection.query('DELETE FROM followups');
    
    // Reset auto increment
    await connection.query('ALTER TABLE appointments AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE time_slots AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE doctors AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE categories AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE followups AUTO_INCREMENT = 1');
    
    // Insert categories
    await connection.query(`
      INSERT INTO categories (name) VALUES 
      ('General Medicine'),
      ('Cardiology'),
      ('Orthopedics'),
      ('Pediatrics')
    `);
    
    // Insert doctors
    await connection.query(`
      INSERT INTO doctors (name, category_id) VALUES 
      ('Dr. Smith', 1),
      ('Dr. Johnson', 2),
      ('Dr. Williams', 3),
      ('Dr. Brown', 4)
    `);
    
    console.log('✅ Database reset successfully');
    console.log('✅ Added 4 categories');
    console.log('✅ Added 4 doctors');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetDatabase();
