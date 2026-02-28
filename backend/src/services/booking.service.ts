import { getSession, saveSession, clearSession } from '../state/session.store'
import { sendText, sendInteractiveButtons, sendInteractiveList } from './whatsapp.service'
import { saveAppointment } from './db.service'

function getNext7Days() {
  const days = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    days.push({
      id: formatted.toLowerCase().replace(/\s/g, '_'),
      title: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatted
    })
  }
  return days
}

export async function processBookingMessage(message: {
  from: string
  text: string
}) {
  const phone = message.from
  const input = message.text.toLowerCase()

  const session = getSession(phone)
  let response = ''

  switch (session.state) {
    case 'idle':
      // Only start booking if user says hello/hi/book
      if (input.includes('hello') || input.includes('hi') || input.includes('book') || input.includes('appointment')) {
        const dates = getNext7Days()
        await sendInteractiveList(
          phone,
          '👋 Hello! I can help you book a doctor appointment.\n\nPlease select your preferred date:',
          'Select Date',
          [{
            title: 'Available Dates',
            rows: dates
          }]
        )
        session.state = 'booking_date'
        response = 'Date selection sent'
      } else {
        response = '👋 Hello! Type "hello" or "book appointment" to get started.'
        await sendText(phone, response)
      }
      break

    case 'booking_date':
      const validDates = getNext7Days().map(d => d.title.toLowerCase())
      if (!validDates.includes(input)) {
        response = '❌ Please select a date from the list provided.'
        await sendText(phone, response)
        break
      }
      session.data.date = input
      await sendInteractiveList(
        phone,
        '📅 Date noted!\n\nWhat time would you prefer?',
        'Select Time',
        [{
          title: 'Morning Slots',
          rows: [
            { id: '9am', title: '9:00 AM' },
            { id: '10am', title: '10:00 AM' },
            { id: '11am', title: '11:00 AM' }
          ]
        }, {
          title: 'Afternoon Slots',
          rows: [
            { id: '2pm', title: '2:00 PM' },
            { id: '3pm', title: '3:00 PM' },
            { id: '4pm', title: '4:00 PM' }
          ]
        }]
      )
      session.state = 'booking_time'
      response = 'Time selection sent'
      break

    case 'booking_time':
      const validTimes = ['9:00 am', '10:00 am', '11:00 am', '2:00 pm', '3:00 pm', '4:00 pm']
      if (!validTimes.includes(input)) {
        response = '❌ Please select a time from the list provided.'
        await sendText(phone, response)
        break
      }
      session.data.time = input
      response = '⏰ Time confirmed!\n\nWhat is the reason for your visit? 🏥'
      await sendText(phone, response)
      session.state = 'booking_reason'
      break

    case 'booking_reason':
      session.data.reason = input
      
      // Save to database
      saveAppointment(phone, session.data.date!, session.data.time!, session.data.reason)
      
      response = `✅ Appointment Confirmed!\n\n📋 Summary:\n📅 Date: ${session.data.date}\n🕐 Time: ${session.data.time}\n💬 Reason: ${session.data.reason}\n\nThank you! See you soon! 🙏`
      await sendText(phone, response)
      clearSession(phone)
      return response
  }

  saveSession(phone, session)
  return response
}