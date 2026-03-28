import express from 'express'
import cors from 'cors'
import whatsappRouter from './routes/whatsapp.route'
import inviteRouter from './routes/invite.route'
import appointmentsRouter from './routes/appointments.route'
import adminRouter from './routes/admin.route'
import followupRouter from './routes/followup.route'
import authRouter from './routes/auth.route'
import { requireAuth } from './core/auth.middleware'

const app = express()
app.use(cors())
app.use(express.json())

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`\n🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.method === 'POST') {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2))
  }
  next()
})

app.get('/ping', (req, res) => {
  res.status(200).send('pong')
})

app.use('/auth', authRouter)
app.use('/webhooks/whatsapp', whatsappRouter)
app.use('/invite', inviteRouter)
app.use('/appointments', requireAuth, appointmentsRouter)
app.use('/admin/appointments', requireAuth, adminRouter)
app.use('/admin/followups', requireAuth, followupRouter)

export default app
