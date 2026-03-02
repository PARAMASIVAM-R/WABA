import { processBookingMessage } from './services/booking.service'

async function testBookingFlow() {
  const phone = '916379773448'
  
  console.log('Testing booking flow...\n')
  
  // Step 1: Start conversation
  console.log('1. User: hi')
  await processBookingMessage({ from: phone, text: 'hi' })
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Step 2: Select category
  console.log('\n2. User: general medicine')
  await processBookingMessage({ from: phone, text: 'general medicine' })
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Step 3: Select doctor
  console.log('\n3. User: dr. john smith')
  await processBookingMessage({ from: phone, text: 'dr. john smith' })
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Step 4: Select date
  console.log('\n4. User: today')
  await processBookingMessage({ from: phone, text: 'today' })
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Step 5: Select time
  console.log('\n5. User: 09:00 am')
  await processBookingMessage({ from: phone, text: '09:00 am' })
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Step 6: Enter name
  console.log('\n6. User: John Doe')
  await processBookingMessage({ from: phone, text: 'John Doe' })
  
  console.log('\n✅ Test complete!')
}

testBookingFlow().catch(console.error)
