import axios from 'axios'
import { env } from '../config/env'

export async function sendText(to: string, text: string) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${env.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log(`✅ Sent to ${to}: ${text.substring(0, 50)}...`)
    console.log('Response:', response.data)
  } catch (error: any) {
    console.log(`❌ Failed to send to ${to}`)
    if (error.response) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.log('Error:', error.message)
    }
  }
}

export async function sendInteractiveButtons(to: string, bodyText: string, buttons: { id: string, title: string }[]) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: { id: btn.id, title: btn.title }
            }))
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${env.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log(`✅ Sent interactive buttons to ${to}`)
  } catch (error: any) {
    console.log(`❌ Failed to send buttons to ${to}`)
    if (error.response) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

export async function sendInteractiveList(to: string, bodyText: string, buttonText: string, sections: { title: string, rows: { id: string, title: string }[] }[]) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${env.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: bodyText },
          action: {
            button: buttonText,
            sections
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${env.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log(`✅ Sent interactive list to ${to}`)
  } catch (error: any) {
    console.log(`❌ Failed to send list to ${to}`)
    if (error.response) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2))
    }
  }
}