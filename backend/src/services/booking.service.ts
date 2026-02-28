import { getSession, saveSession, clearSession } from '../state/session.store'
import { sendText, sendInteractiveList } from './whatsapp.service'
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

  const session = getSession(phone)
  let response = ''

  switch (session.state) {
    case 'idle':
      if (input.includes('hello') || input.includes('hi') || input.includes('book') || input.includes('appointment')) {
        // Send welcome message first
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
        `👨‍⚕️ Select a doctor from ${selectedCategory.name}:`,
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
      const doctorsList = await getDoctorsByCategory(cat!.id)
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
      session.data.date = input
      
      const catForSlots = await getCategories()
      const categoryObj = catForSlots.find(c => c.name === session.data.category)
      const doctorsForSlots = await getDoctorsByCategory(categoryObj!.id)
      const doctorObj = doctorsForSlots.find(d => d.name === session.data.doctor)
      const timeSlots = await getTimeSlotsByDoctor(doctorObj!.id)
      
      if (timeSlots.length === 0) {
        response = '❌ No time slots available for this doctor.'
        await sendText(phone, response)
        break
      }
      
      await sendInteractiveList(
        phone,
        '🕐 Select your preferred time:',
        'Select Time',
        [{
          title: 'Available Slots',
          rows: timeSlots.map(t => ({ id: t.id.toString(), title: t.time }))
        }]
      )
      session.state = 'booking_time'
      response = 'Time selection sent'
      break

    case 'booking_time':
      const catForTime = await getCategories()
      const categoryForTime = catForTime.find(c => c.name === session.data.category)
      const doctorsForTime = await getDoctorsByCategory(categoryForTime!.id)
      const doctorForTime = doctorsForTime.find(d => d.name === session.data.doctor)
      const slots = await getTimeSlotsByDoctor(doctorForTime!.id)
      const validTime = slots.find(s => s.time.toLowerCase() === input)
      
      if (!validTime) {
        response = '❌ Please select a time from the list provided.'
        await sendText(phone, response)
        break
      }
      session.data.time = validTime.time
      response = '⏰ Time confirmed!\n\nWhat is the reason for your visit? 🏥'
      await sendText(phone, response)
      session.state = 'booking_reason'
      break

    case 'booking_reason':
      session.data.reason = input
      
      saveAppointment(phone, session.data.category!, session.data.doctor!, session.data.date!, session.data.time!, session.data.reason)
      
      response = `✅ Appointment Confirmed!\n\n📋 Summary:\n🏥 Category: ${session.data.category}\n👨‍⚕️ Doctor: ${session.data.doctor}\n📅 Date: ${session.data.date}\n🕐 Time: ${session.data.time}\n💬 Reason: ${session.data.reason}\n\nThank you! See you soon! 🙏`
      await sendText(phone, response)
      clearSession(phone)
      return response
  }

  saveSession(phone, session)
  return response
}