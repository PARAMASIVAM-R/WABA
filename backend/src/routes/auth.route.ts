import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../services/db.service'
import { env } from '../config/env'
import { requireAuth, requireRole } from '../core/auth.middleware'

const router = Router()

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }

  const [rows] = await pool.query(
    'SELECT id, hospital_id, password_hash, role FROM users WHERE email = ?',
    [email]
  ) as any[]

  const user = (rows as any[])[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign(
    { user_id: user.id, hospital_id: user.hospital_id, role: user.role },
    env.jwtSecret,
    { expiresIn: '8h' }
  )

  res.json({ token, role: user.role, hospital_id: user.hospital_id })
})

// POST /auth/register — admin only, creates a new user under same hospital
router.post('/register', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { email, password, role } = req.body
  if (!email || !password || !role) {
    res.status(400).json({ error: 'email, password, role required' })
    return
  }

  const hash = await bcrypt.hash(password, 10)
  await pool.query(
    'INSERT INTO users (hospital_id, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [req.user!.hospital_id, email, hash, role]
  )

  res.status(201).json({ message: 'User created' })
})

export default router
