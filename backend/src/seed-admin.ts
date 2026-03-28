/**
 * Run once to:
 *  1. Apply multi-tenant migration (hospitals + users tables, hospital_id columns)
 *  2. Create the first hospital + admin user
 *
 * Usage:
 *   npx ts-node src/seed-admin.ts
 *
 * Override defaults with env vars:
 *   ADMIN_EMAIL=you@hospital.com ADMIN_PASSWORD=secret npx ts-node src/seed-admin.ts
 */

import dotenv from 'dotenv'
dotenv.config()

import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@hospital.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234'
const HOSPITAL_NAME  = process.env.HOSPITAL_NAME  || 'Default Hospital'
const HOSPITAL_WA    = process.env.HOSPITAL_WA    || '+910000000000'

async function columnExists(pool: mysql.Pool, table: string, column: string): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  ) as any[]
  return (rows as any[]).length > 0
}

async function main() {
  const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'WABA',
  })

  try {
    // ── 1. Create hospitals table ─────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ hospitals table ready')

    // ── 2. Create users table ─────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        hospital_id INT NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','receptionist') NOT NULL DEFAULT 'receptionist',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ users table ready')

    // ── 3. Seed default hospital (id=1) for existing data ─────────────────────
    await pool.query(`
      INSERT INTO hospitals (id, name, whatsapp_number)
      VALUES (1, 'Default Hospital', '+910000000000')
      ON DUPLICATE KEY UPDATE name = name
    `)

    // ── 4. Add hospital_id to existing tables ─────────────────────────────────
    const tables = ['categories', 'doctors', 'time_slots', 'appointments', 'followups']

    for (const table of tables) {
      if (await columnExists(pool, table, 'hospital_id')) {
        console.log(`ℹ️  ${table}.hospital_id already exists, skipping`)
        continue
      }
      await pool.query(
        `ALTER TABLE \`${table}\` ADD COLUMN hospital_id INT NOT NULL DEFAULT 1 AFTER id`
      )
      await pool.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT \`fk_${table}_hospital\`
         FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE`
      )
      console.log(`✅ Added hospital_id to ${table}`)
    }

    // ── 5. Upsert the target hospital ─────────────────────────────────────────
    const [existing] = await pool.query(
      'SELECT id FROM hospitals WHERE whatsapp_number = ?',
      [HOSPITAL_WA]
    ) as any[]

    let hospitalId: number
    if ((existing as any[]).length > 0) {
      hospitalId = (existing as any[])[0].id
      console.log(`ℹ️  Hospital already exists (id=${hospitalId})`)
    } else {
      const [result] = await pool.query(
        'INSERT INTO hospitals (name, whatsapp_number) VALUES (?, ?)',
        [HOSPITAL_NAME, HOSPITAL_WA]
      ) as any[]
      hospitalId = (result as any).insertId
      console.log(`✅ Hospital created (id=${hospitalId}): ${HOSPITAL_NAME}`)
    }

    // ── 6. Create admin user ──────────────────────────────────────────────────
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    ) as any[]

    if ((existingUser as any[]).length > 0) {
      console.log(`ℹ️  User ${ADMIN_EMAIL} already exists, skipping`)
    } else {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
      await pool.query(
        'INSERT INTO users (hospital_id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [hospitalId, ADMIN_EMAIL, hash, 'admin']
      )
      console.log(`✅ Admin user created: ${ADMIN_EMAIL}`)
    }

    console.log('\n🎉 Done! Login with:')
    console.log(`   POST /auth/login`)
    console.log(`   { "email": "${ADMIN_EMAIL}", "password": "${ADMIN_PASSWORD}" }`)

  } finally {
    await pool.end()
  }
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
