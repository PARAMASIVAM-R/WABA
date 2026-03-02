import express from 'express'
import cors from 'cors'
import whatsappRouter from './routes/whatsapp.route'
import inviteRouter from './routes/invite.route'
import appointmentsRouter from './routes/appointments.route'
import adminRouter from './routes/admin.route'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/ping', (req, res) => {
  res.status(200).send('pong')
})

app.use('/webhooks/whatsapp', whatsappRouter)
app.use('/invite', inviteRouter)
app.use('/appointments', appointmentsRouter)
app.use('/admin/appointments', adminRouter)

export default app
