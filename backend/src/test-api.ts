import axios from 'axios'
import { env } from './config/env'

async function testWhatsAppAPI() {
  console.log('Testing WhatsApp API credentials...\n')
  console.log('Phone Number ID:', env.phoneNumberId)
  console.log('Access Token:', env.accessToken.substring(0, 20) + '...\n')

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '916379773448',
        type: 'text',
        text: { body: 'Test message from API' }
      },
      {
        headers: {
          Authorization: `Bearer ${env.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('✅ SUCCESS! API is working')
    console.log('Response:', response.data)
  } catch (error: any) {
    console.log('❌ FAILED! API credentials are invalid')
    if (error.response) {
      console.log('Error:', error.response.data)
    } else {
      console.log('Error:', error.message)
    }
  }
}

testWhatsAppAPI()
