import { Router } from 'express'
import { getAppointments, getAppointmentsByPhone } from '../services/db.service'

const router = Router()

router.get('/', (req, res) => {
  const appointments = getAppointments()
  res.json({ total: appointments.length, appointments })
})

router.get('/:phone', (req, res) => {
  const appointments = getAppointmentsByPhone(req.params.phone)
  res.json({ total: appointments.length, appointments })
})

export default router
