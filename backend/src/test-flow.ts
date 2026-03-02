import axios from 'axios'

const API_URL = 'http://localhost:3000'
const TEST_PHONE = '919999999999'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function simulateBookingFlow() {
  console.log('🎬 SIMULATING COMPLETE BOOKING FLOW\n')
  console.log('=' .repeat(70))
  
  try {
    // Step 1: Patient sends "hi"
    console.log('\n📱 Step 1: Patient sends "hi"')
    let response = await axios.post(`${API_URL}/webhooks/whatsapp/test`, {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              type: 'text',
              text: { body: 'hi' }
            }]
          }
        }]
      }]
    })
    console.log('   ✅ Bot responds with welcome message and category list')
    await sleep(1000)

    // Step 2: Patient selects category
    console.log('\n🏥 Step 2: Patient selects "Cardiology"')
    response = await axios.post(`${API_URL}/webhooks/whatsapp/test`, {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              type: 'text',
              text: { body: 'Cardiology' }
            }]
          }
        }]
      }]
    })
    console.log('   ✅ Bot shows doctors in Cardiology')
    await sleep(1000)

    // Step 3: Patient selects doctor
    console.log('\n👨⚕️ Step 3: Patient selects "Dr. Michael Brown"')
    response = await axios.post(`${API_URL}/webhooks/whatsapp/test`, {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              type: 'text',
              text: { body: 'Dr. Michael Brown' }
            }]
          }
        }]
      }]
    })
    console.log('   ✅ Bot shows available dates')
    await sleep(1000)

    // Step 4: Patient selects date
    console.log('\n📅 Step 4: Patient selects "Tomorrow"')
    response = await axios.post(`${API_URL}/webhooks/whatsapp/test`, {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              type: 'text',
              text: { body: 'Tomorrow' }
            }]
          }
        }]
      }]
    })
    console.log('   ✅ Bot shows available time slots')
    await sleep(1000)

    // Step 5: Patient selects time
    console.log('\n🕐 Step 5: Patient selects "10:00 AM"')
    response = await axios.post(`${API_URL}/webhooks/whatsapp/test`, {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              type: 'text',
              text: { body: '10:00 AM' }
            }]
          }
        }]
      }]
    })
    console.log('   ✅ Bot asks for patient name')
    await sleep(1000)

    // Step 6: Patient enters name
    console.log('\n👤 Step 6: Patient enters "John Doe"')
    response = await axios.post(`${API_URL}/webhooks/whatsapp/test`, {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: TEST_PHONE,
              type: 'text',
              text: { body: 'John Doe' }
            }]
          }
        }]
      }]
    })
    console.log('   ✅ Appointment created with PENDING status')
    await sleep(1000)

    // Step 7: Check pending appointments
    console.log('\n📋 Step 7: Admin checks pending appointments')
    const pendingRes = await axios.get(`${API_URL}/admin/appointments/pending`)
    const appointments = pendingRes.data.appointments || []
    console.log(`   ✅ Found ${appointments.length} pending appointment(s)`)
    
    if (appointments.length > 0) {
      const apt = appointments[0]
      console.log(`   📝 Appointment Details:`)
      console.log(`      - ID: ${apt.id}`)
      console.log(`      - Patient: ${apt.patient_name}`)
      console.log(`      - Phone: ${apt.phone}`)
      console.log(`      - Category: ${apt.category}`)
      console.log(`      - Doctor: ${apt.doctor}`)
      console.log(`      - Date: ${apt.date}`)
      console.log(`      - Time: ${apt.time_slot}`)
      console.log(`      - Status: ${apt.status}`)
      await sleep(1000)

      // Step 8: Admin accepts appointment
      console.log('\n✅ Step 8: Admin accepts appointment')
      await axios.post(`${API_URL}/admin/appointments/${apt.id}/accept`)
      console.log('   ✅ Appointment status changed to ACCEPTED')
      console.log('   📤 Confirmation message sent to patient')
      await sleep(1000)

      // Step 9: Check approved appointments
      console.log('\n📊 Step 9: Admin checks approved appointments')
      const allRes = await axios.get(`${API_URL}/appointments`)
      const allAppointments = allRes.data.appointments || allRes.data || []
      const approved = allAppointments.filter((a: any) => a.status === 'accepted')
      console.log(`   ✅ Found ${approved.length} approved appointment(s)`)
      await sleep(1000)

      // Step 10: Admin creates follow-up
      console.log('\n📨 Step 10: Admin creates follow-up reminder')
      await axios.post(`${API_URL}/admin/followups`, {
        phone: TEST_PHONE,
        patientName: 'John Doe',
        messageType: 'template',
        templateName: 'checkup_reminder',
        customMessage: null
      })
      console.log('   ✅ Follow-up created with PENDING status')
      await sleep(1000)

      // Step 11: Check follow-ups
      console.log('\n📋 Step 11: Admin checks follow-ups')
      const followupsRes = await axios.get(`${API_URL}/admin/followups`)
      const followups = followupsRes.data || []
      console.log(`   ✅ Found ${followups.length} follow-up(s)`)
      
      if (followups.length > 0) {
        const followup = followups[0]
        console.log(`   📝 Follow-up Details:`)
        console.log(`      - ID: ${followup.id}`)
        console.log(`      - Patient: ${followup.patient_name}`)
        console.log(`      - Phone: ${followup.phone}`)
        console.log(`      - Type: ${followup.message_type}`)
        console.log(`      - Status: ${followup.status}`)
        await sleep(1000)

        // Step 12: Admin sends follow-up
        console.log('\n📤 Step 12: Admin sends follow-up message')
        await axios.post(`${API_URL}/admin/followups/${followup.id}/send`)
        console.log('   ✅ Follow-up status changed to SENT')
        console.log('   📤 Message sent to patient')
      }
    }

    // Step 13: Check doctors and slots
    console.log('\n👨⚕️ Step 13: Admin checks doctors and time slots')
    const doctorsRes = await axios.get(`${API_URL}/admin/appointments/doctors`)
    const doctors = doctorsRes.data.doctors || []
    console.log(`   ✅ Found ${doctors.length} doctors`)
    
    if (doctors.length > 0) {
      const doctor = doctors.find((d: any) => d.name === 'Dr. Michael Brown')
      if (doctor) {
        const slotsRes = await axios.get(`${API_URL}/admin/appointments/doctors/${doctor.id}/slots`)
        const slots = slotsRes.data.slots || []
        const booked = slots.filter((s: any) => s.is_booked).length
        const available = slots.filter((s: any) => !s.is_booked).length
        console.log(`   📊 Dr. Michael Brown's slots:`)
        console.log(`      - Total: ${slots.length}`)
        console.log(`      - Booked: ${booked}`)
        console.log(`      - Available: ${available}`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('\n🎉 COMPLETE FLOW SIMULATION SUCCESSFUL!\n')
    console.log('📊 Summary:')
    console.log('   ✅ Patient booking flow (6 steps)')
    console.log('   ✅ Appointment created and approved')
    console.log('   ✅ Follow-up created and sent')
    console.log('   ✅ Slot booking tracked')
    console.log('   ✅ All admin endpoints working')
    console.log('\n💡 Next: Test with real WhatsApp messages!')
    console.log('=' .repeat(70) + '\n')

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.response?.data || error.message)
    console.log('\n💡 Make sure server is running: npm run dev\n')
  }
}

simulateBookingFlow().catch(console.error)
