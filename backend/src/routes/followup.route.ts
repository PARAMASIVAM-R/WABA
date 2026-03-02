import { Router } from 'express'
import { createFollowup, getFollowups, markFollowupAsSent } from '../services/db.service'
import { sendText } from '../services/whatsapp.service'

const router = Router()

const TEMPLATES = {
  'checkup_reminder': '👋 Hi! This is a reminder for your upcoming checkup. Please contact us to schedule your appointment. 🏥',
  'test_results': '📋 Your test results are ready! Please visit the hospital to collect them or call us for details. 📞',
  'medication_refill': '💊 Time to refill your medication! Please contact your doctor or visit the pharmacy. 🏥',
  'followup_appointment': '📅 It\'s time to schedule your follow-up appointment. Please call us at your earliest convenience. ☎️'
}

// Create followup
router.post('/', async (req, res) => {
  try {
    const { phone, patientName, messageType, templateName, customMessage } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    if (messageType === 'custom' && !customMessage) {
      return res.status(400).json({ error: 'Custom message is required' })
    }

    if (messageType === 'template' && !templateName) {
      return res.status(400).json({ error: 'Template name is required' })
    }

    await createFollowup(phone, patientName || null, messageType, templateName || null, customMessage || null)
    res.json({ success: true, message: 'Follow-up created successfully' })
  } catch (error) {
    console.error('Error creating followup:', error)
    res.status(500).json({ error: 'Failed to create follow-up' })
  }
})

// Get all followups
router.get('/', async (req, res) => {
  try {
    const followups = await getFollowups()
    res.json(followups)
  } catch (error) {
    console.error('Error fetching followups:', error)
    res.status(500).json({ error: 'Failed to fetch follow-ups' })
  }
})

// Send followup message
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params
    const followups = await getFollowups()
    const followup = (followups as any[]).find(f => f.id === parseInt(id))

    if (!followup) {
      return res.status(404).json({ error: 'Follow-up not found' })
    }

    if (followup.status === 'sent') {
      return res.status(400).json({ error: 'Follow-up already sent' })
    }

    let message = ''
    if (followup.message_type === 'template') {
      message = TEMPLATES[followup.template_name as keyof typeof TEMPLATES] || followup.custom_message
    } else {
      message = followup.custom_message
    }

    await sendText(followup.phone, message)
    await markFollowupAsSent(parseInt(id))

    res.json({ success: true, message: 'Follow-up sent successfully' })
  } catch (error) {
    console.error('Error sending followup:', error)
    res.status(500).json({ error: 'Failed to send follow-up' })
  }
})

// Get available templates
router.get('/templates', (req, res) => {
  const templates = Object.keys(TEMPLATES).map(key => ({
    id: key,
    name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    message: TEMPLATES[key as keyof typeof TEMPLATES]
  }))
  res.json(templates)
})

export default router
