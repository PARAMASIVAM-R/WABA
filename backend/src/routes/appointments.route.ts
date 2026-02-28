import { Router } from 'express'
import { getAppointments, getAppointmentsByPhone } from '../services/db.service'

const router = Router()

router.get('/', async (req, res) => {
  const appointments = await getAppointments()
  res.json({ total: (appointments as any[]).length, appointments })
})

router.get('/:phone', async (req, res) => {
  const appointments = await getAppointmentsByPhone(req.params.phone)
  res.json({ total: (appointments as any[]).length, appointments })
})

export default router
