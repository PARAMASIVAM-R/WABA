import express from 'express'
import whatsappRouter from './routes/whatsapp.route'
import inviteRouter from './routes/invite.route'
import appointmentsRouter from './routes/appointments.route'

const app = express()
app.use(express.json())

app.get('/ping', (req, res) => {
  res.status(200).send('pong')
})

app.use('/webhooks/whatsapp', whatsappRouter)
app.use('/invite', inviteRouter)
app.use('/appointments', appointmentsRouter)

export default app