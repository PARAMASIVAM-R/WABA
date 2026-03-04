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
      
      // Generate time slots based on doctor configuration
      const slotsPerDay = doctorObj.slots_per_day || 4
      const capacityPerSlot = doctorObj.capacity_per_slot || 5
      const startTime = doctorObj.start_time || '09:00:00'
      const endTime = doctorObj.end_time || '17:00:00'
      const timeSlots = []
      
      console.log('Doctor config:', { slotsPerDay, capacityPerSlot, startTime, endTime })
      console.log('Checking availability for date:', formattedDate)
      
      const [startHours, startMinutes] = startTime.split(':')
      const [endHours, endMinutes] = endTime.split(':')
      const startMinutesTotal = parseInt(startHours) * 60 + parseInt(startMinutes)
      const endMinutesTotal = parseInt(endHours) * 60 + parseInt(endMinutes)
      const slotDuration = Math.floor((endMinutesTotal - startMinutesTotal) / slotsPerDay)
      
      // Get existing bookings for this doctor and date
      const mysql = require('mysql2/promise')
      const { env } = require('../config/env')
      const pool = mysql.createPool({
        host: env.dbHost,
        user: env.dbUser,
        password: env.dbPassword,
        database: env.dbName
      })
      
      try {
        for (let i = 0; i < slotsPerDay; i++) {
          const slotStartMinutes = startMinutesTotal + (i * slotDuration)
          const slotEndMinutes = slotStartMinutes + slotDuration
          const slotStartHour = Math.floor(slotStartMinutes / 60)
          const slotStartMin = slotStartMinutes % 60
          const slotEndHour = Math.floor(slotEndMinutes / 60)
          const slotEndMin = slotEndMinutes % 60
          
          const formatTime = (h: number, m: number) => {
            const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
            const ampm = h >= 12 ? 'PM' : 'AM'
            return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
          }
          
          const slotTime = `${formatTime(slotStartHour, slotStartMin)} - ${formatTime(slotEndHour, slotEndMin)}`
          
          // Count existing bookings for this slot
          const [bookings] = await pool.query(
            `SELECT COUNT(*) as count FROM appointments 
             WHERE doctor = ? AND date = ? AND time_slot = ? AND status IN ('pending', 'accepted', 'visited')`,
            [session.data.doctor, formattedDate, slotTime]
          ) as any
          
          const bookedCount = bookings[0].count
          const availableSpots = capacityPerSlot - bookedCount
          
          console.log(`Slot ${slotTime}: ${bookedCount}/${capacityPerSlot} booked, ${availableSpots} available`)
          
          // Only show slots with available capacity
          if (availableSpots > 0) {
            timeSlots.push({
              id: i.toString(),
              title: slotTime
            })
          }
        }
      } finally {
        await pool.end()
      }
      
      console.log('Total available slots:', timeSlots.length)
      
      if (timeSlots.length === 0) {
        response = '❌ All slots are fully booked for this date. Please select another date or try a different doctor.'
        await sendText(phone, response)
        session.state = 'booking_date'
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
      session.data.time = message.text
      response = '⏰ Time confirmed!\n\nPlease enter your full name: 👤'
      await sendText(phone, response)
      session.state = 'booking_name'
      break

    case 'booking_name':
      session.data.name = message.text
      
      await saveAppointment(
        phone, 
        session.data.name, 
        session.data.category!, 
        session.data.doctor!, 
        session.data.date!, 
        session.data.time!,
        0 // No timeSlotId needed anymore
      )
      
      const displayDate = session.data.dateDisplay || session.data.date || 'N/A'
      response = `✅ Appointment Request Submitted!\n\n📋 Summary:\n👤 Name: ${session.data.name}\n🏥 Category: ${session.data.category}\n👨⚕️ Doctor: ${session.data.doctor}\n📅 Date: ${displayDate}\n🕐 Time: ${session.data.time}\n\n⏳ Status: Pending Approval\n\nYour appointment request has been sent to the hospital. You will receive a confirmation once it's reviewed by the receptionist.\n\nThank you! 🙏`
      await sendText(phone, response)
      clearSession(phone)
      return response
  }

  saveSession(phone, session)
  return response
}
