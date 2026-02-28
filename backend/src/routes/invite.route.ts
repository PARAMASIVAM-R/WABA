import { Router } from 'express'
import { sendText } from '../services/whatsapp.service'

const router = Router()

router.post('/send', async (req, res) => {
  const { phone, message } = req.body
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message required' })
  }

  await sendText(phone, message)
  res.json({ success: true })
})

export default router
