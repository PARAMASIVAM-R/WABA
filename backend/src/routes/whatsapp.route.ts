import { Router } from 'express'
import { env } from '../config/env'
import { extractMessage } from '../utils/webhook.util'
import { processBookingMessage } from '../services/booking.service'

const router = Router()

// Incoming messages
router.post('/', async (req, res) => {
  try {
    console.log('📥 Webhook received:', JSON.stringify(req.body, null, 2))
    res.sendStatus(200) // ACK immediately

    const message = extractMessage(req.body)
    if (!message) {
      console.log('❌ No valid message extracted from payload')
      console.log('Payload structure:', JSON.stringify(req.body, null, 2))
      return
    }

    console.log('✅ Message extracted:', message)
    console.log('📞 From:', message.from)
    console.log('💬 Text:', message.text)
    
    await processBookingMessage(message)
    console.log('✅ Processing complete')
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
  }
})

// Webhook verification
router.get('/', (req, res) => {
  console.log('🔍 Webhook verification request:', req.query)
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === env.verifyToken) {
    console.log('✅ Webhook verified successfully')
    return res.status(200).send(challenge)
  }
  console.log('❌ Webhook verification failed')
  return res.sendStatus(403)
})

// Test endpoint - returns response
router.post('/test', async (req, res) => {
  const message = extractMessage(req.body)
  if (!message) return res.status(400).json({ error: 'Invalid message' })

  const response = await processBookingMessage(message)
  res.json({ message: 'Processed', response })
})

export default router