import { getSession, saveSession, clearSession } from '../state/session.store'
import { sendText, sendInteractiveList, sendInteractiveButtons } from './whatsapp.service'
import { saveAppointment, getCategories, getDoctorsByCategory, getTimeSlotsByDoctor } from './db.service'

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

  // Check for restart keywords at any point in conversation
  if (input === 'hi' || input === 'hello' || input === 'book') {
    clearSession(phone)
  }

  const session = getSession(phone)
  let response = ''

  switch (session.state) {
    case 'idle':
      if (input.includes('hello') || input.includes('hi') || input.includes('book') || input.includes('appointment')) {
        await sendText(phone, '👋 Welcome! I can help you book a doctor appointment.')
        
        const categories = await getCategories()
        if (categories.length === 0) {
          response = '❌ No categories available. Please contact admin.'
          await sendText(phone, response)
          break
        }
        await sendInteractiveList(
          phone,
          '🏥 Please select a medical category to book your appointment:',
          'Select Category',
          [{
            title: 'Medical Categories',
            rows: categories.map(c => ({ id: c.id.toString(), title: c.name }))
          }]
        )
        session.state = 'booking_category'
        response = 'Category selection sent'
      } else {
        response = '👋 Hello! Type "hello" or "book appointment" to get started.'
        await sendText(phone, response)
      }
      break

    case 'booking_category':
      const categories = await getCategories()
      const selectedCategory = categories.find(c => c.name.toLowerCase() === input)
      if (!selectedCategory) {
        response = '❌ Please select a category from the list provided.'
        await sendText(phone, response)
        break
      }
      session.data.category = selectedCategory.name
      
      const doctors = await getDoctorsByCategory(selectedCategory.id)
      if (doctors.length === 0) {
        response = '❌ No doctors available in this category.'
        await sendText(phone, response)
        break
      }
      await sendInteractiveList(
        phone,
        `👨⚕️ Select a doctor from ${selectedCategory.name}:`,
        'Select Doctor',
        [{
          title: 'Available Doctors',
          rows: doctors.map(d => ({ id: d.id.toString(), title: d.name }))
        }]
      )
      session.state = 'booking_doctor'
      response = 'Doctor selection sent'
      break

    case 'booking_doctor':
      const categoryForDoctor = await getCategories()
      const cat = categoryForDoctor.find(c => c.name === session.data.category)
      if (!cat) break
      const doctorsList = await getDoctorsByCategory(cat.id)
      const selectedDoctor = doctorsList.find(d => d.name.toLowerCase() === input)
      if (!selectedDoctor) {
        response = '❌ Please select a doctor from the list provided.'
        await sendText(phone, response)
        break
      }
      session.data.doctor = selectedDoctor.name
      
      const dates = getNext7Days()
      await sendInteractiveList(
        phone,
        '📅 Select your preferred date:',
        'Select Date',
        [{
          title: 'Available Dates',
          rows: dates
        }]
      )
      session.state = 'booking_date'
      response = 'Date selection sent'
      break

    case 'booking_date':
      const validDates = getNext7Days().map(d => d.title.toLowerCase())
      if (!validDates.includes(input)) {
        response = '❌ Please select a date from the list provided.'
        await sendText(phone, response)
        break
      }
      
      // Convert "today"/"tomorrow" to actual date
      const dateIndex = validDates.indexOf(input)
      const actualDate = new Date()
      actualDate.setDate(actualDate.getDate() + dateIndex)
      const formattedDate = actualDate.toISOString().split('T')[0] // YYYY-MM-DD
      
      session.data.date = formattedDate as string | undefined
      session.data.dateDisplay = input as string | undefined
      
      const catForSlots = await getCategories()
      const categoryObj = catForSlots.find(c => c.name === session.data.category)
      if (!categoryObj) break
      const doctorsForSlots = await getDoctorsByCategory(categoryObj.id)
      const doctorObj = doctorsForSlots.find(d => d.name === session.data.doctor)
      if (!doctorObj) break
      
      // Get time slots from database
      const mysql = require('mysql2/promise')
      const { env } = require('../config/env')
      const pool = mysql.createPool({
        host: env.dbHost,
        user: env.dbUser,
        password: env.dbPassword,
        database: env.dbName
      })
      
      const timeSlots = []
      
      try {
        // Fetch configured time slots for this doctor and date
        const [slots] = await pool.query(
          `SELECT * FROM time_slots 
           WHERE doctor_id = ? AND (date IS NULL OR DATE_FORMAT(date, '%Y-%m-%d') = ?) 
           ORDER BY start_time`,
          [doctorObj.id, formattedDate]
        ) as any
        
        if (slots.length === 0) {
          response = '❌ No time slots available for this doctor on the selected date.\n\n💡 To book a new appointment, please type:\n• "hi" or "hello" or "book"'
          await sendText(phone, response)
          clearSession(phone)
          break
        }
        
        console.log('Doctor time slots:', slots)
        console.log('Checking availability for date:', formattedDate)
        
        for (const slot of slots) {
          const formatTime = (timeStr: string) => {
            const [h, m] = timeStr.split(':')
            const hour = parseInt(h || '0')
            const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
            const ampm = hour >= 12 ? 'PM' : 'AM'
            return `${hour12}${ampm}`
          }
          
          if (!slot.start_time || !slot.end_time) continue
          
          const slotTime = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
          
          // Count existing bookings for this slot
          const [bookings] = await pool.query(
            `SELECT COUNT(*) as count FROM appointments 
             WHERE doctor = ? AND date = ? AND time_slot = ? AND status IN ('confirmed', 'accepted', 'visited', 'completed')`,
            [session.data.doctor, formattedDate, slotTime]
          ) as any
          
          const bookedCount = bookings[0].count
          const availableSpots = slot.capacity - bookedCount
          
          console.log(`Slot ${slotTime}: ${bookedCount}/${slot.capacity} booked, ${availableSpots} available`)
          
          // Only show slots with available capacity
          if (availableSpots > 0) {
            timeSlots.push({
              id: slot.id.toString(),
              title: `${slotTime} [${bookedCount}/${slot.capacity}]`
            })
          }
        }
      } finally {
        await pool.end()
      }
      
      console.log('Total available slots:', timeSlots.length)
      
      if (timeSlots.length === 0) {
        response = '❌ All seats are filled for this date.\n\n💡 To book another date, please type:\n• "hi" or "hello" or "book"'
        await sendText(phone, response)
        clearSession(phone)
        break
      }
      
      await sendInteractiveList(
        phone,
        '🕐 Select your preferred time slot:',
        'Select Time',
        [{
          title: 'Available Slots',
          rows: timeSlots
        }]
      )
      session.state = 'booking_time'
      response = 'Time selection sent'
      break

    case 'booking_time':
      // Remove the booking count from time slot before saving
      const cleanTimeSlot = message.text.replace(/\s*\[\d+\/\d+\]\s*$/, '')
      session.data.time = cleanTimeSlot
      response = '⏰ Time confirmed!\n\nPlease enter your full name: 👤'
      await sendText(phone, response)
      session.state = 'booking_name'
      break

    case 'booking_name':
      session.data.name = message.text
      
      const displayDate = session.data.dateDisplay || session.data.date || 'N/A'
      await sendInteractiveButtons(
        phone,
        `📋 Appointment Summary:\n\n👤 Name: ${session.data.name}\n🏥 Category: ${session.data.category}\n👨⚕️ Doctor: ${session.data.doctor}\n📅 Date: ${displayDate}\n🕐 Time: ${session.data.time}\n\nPlease confirm your appointment:`,
        [
          { id: 'confirm', title: 'Confirm' },
          { id: 'cancel', title: 'Cancel' }
        ]
      )
      session.state = 'booking_confirm'
      response = 'Confirmation buttons sent'
      break

    case 'booking_confirm':
      if (input === 'confirm') {
        await saveAppointment(
          phone, 
          session.data.name!, 
          session.data.category!, 
          session.data.doctor!, 
          session.data.date!, 
          session.data.time!,
          0
        )
        
        const displayDate2 = session.data.dateDisplay || session.data.date || 'N/A'
        response = `✅ Appointment Confirmed!\n\n📋 Details:\n👤 Name: ${session.data.name}\n🏥 Category: ${session.data.category}\n👨⚕️ Doctor: ${session.data.doctor}\n📅 Date: ${displayDate2}\n🕐 Time: ${session.data.time}\n\n✅ Status: Confirmed\n\nYour appointment is confirmed! Please arrive 10 minutes early.\n\nThank you! 🙏`
        await sendText(phone, response)
        clearSession(phone)
      } else if (input === 'cancel') {
        response = '❌ Appointment cancelled.\n\n💡 To book a new appointment, type:\n• "hi" or "hello" or "book"'
        await sendText(phone, response)
        clearSession(phone)
      } else {
        response = '❌ Please type "confirm" to book or "cancel" to cancel.'
        await sendText(phone, response)
      }
      break
  }

  saveSession(phone, session)
  return response
}
