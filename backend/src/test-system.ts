import axios from 'axios'
import mysql from 'mysql2/promise'
import { env } from './config/env'

const API_URL = 'http://localhost:3000'
const NGROK_API = 'http://127.0.0.1:4040/api/tunnels'

async function testSystem() {
  console.log('🧪 SYSTEM HEALTH CHECK\n')
  console.log('=' .repeat(60))
  
  let allPassed = true

  // Test 1: Environment Variables
  console.log('\n📋 Test 1: Environment Variables')
  try {
    if (!env.accessToken || env.accessToken.length < 50) {
      throw new Error('Invalid access token')
    }
    if (!env.phoneNumberId) {
      throw new Error('Missing phone number ID')
    }
    if (!env.verifyToken) {
      throw new Error('Missing verify token')
    }
    console.log('   ✅ All environment variables configured')
    console.log(`   📞 Phone Number ID: ${env.phoneNumberId}`)
    console.log(`   🔑 Access Token: ${env.accessToken.substring(0, 20)}...`)
    console.log(`   🔐 Verify Token: ${env.verifyToken}`)
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`)
    allPassed = false
  }

  // Test 2: Database Connection
  console.log('\n🗄️  Test 2: Database Connection')
  try {
    const connection = await mysql.createConnection({
      host: env.dbHost,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName
    })
    
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories')
    const [doctors] = await connection.query('SELECT COUNT(*) as count FROM doctors')
    const [slots] = await connection.query('SELECT COUNT(*) as count FROM time_slots')
    const [appointments] = await connection.query('SELECT COUNT(*) as count FROM appointments')
    const [followups] = await connection.query('SELECT COUNT(*) as count FROM followups')
    
    await connection.end()
    
    console.log('   ✅ Database connected successfully')
    console.log(`   📊 Categories: ${(categories as any)[0].count}`)
    console.log(`   👨⚕️ Doctors: ${(doctors as any)[0].count}`)
    console.log(`   🕐 Time Slots: ${(slots as any)[0].count}`)
    console.log(`   📅 Appointments: ${(appointments as any)[0].count}`)
    console.log(`   📨 Follow-ups: ${(followups as any)[0].count}`)
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`)
    allPassed = false
  }

  // Test 3: Server Running
  console.log('\n🖥️  Test 3: Backend Server')
  try {
    const response = await axios.get(`${API_URL}/ping`, { timeout: 3000 })
    if (response.data === 'pong') {
      console.log('   ✅ Server is running on port 3000')
    } else {
      throw new Error('Unexpected response')
    }
  } catch (error: any) {
    console.log(`   ❌ FAILED: Server not responding (${error.message})`)
    console.log('   💡 Run: npm run dev')
    allPassed = false
  }

  // Test 4: WhatsApp API
  console.log('\n📱 Test 4: WhatsApp API Connection')
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${env.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '916379773448',
        type: 'text',
        text: { body: '🧪 System test - API working!' }
      },
      {
        headers: {
          'Authorization': `Bearer ${env.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('   ✅ WhatsApp API is working')
    console.log(`   📤 Test message sent successfully`)
    console.log(`   🆔 Message ID: ${response.data.messages[0].id}`)
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.response?.data?.error?.message || error.message}`)
    if (error.response?.data?.error?.code === 190) {
      console.log('   💡 Access token expired - generate new token from Meta console')
    }
    allPassed = false
  }

  // Test 5: ngrok Tunnel
  console.log('\n🌐 Test 5: ngrok Tunnel')
  try {
    const response = await axios.get(NGROK_API, { timeout: 3000 })
    const tunnel = response.data.tunnels.find((t: any) => t.proto === 'https')
    if (tunnel) {
      console.log('   ✅ ngrok tunnel is active')
      console.log(`   🔗 Public URL: ${tunnel.public_url}`)
      console.log(`   📍 Webhook URL: ${tunnel.public_url}/webhooks/whatsapp`)
      console.log(`   📊 Requests: ${tunnel.metrics.http.count}`)
    } else {
      throw new Error('No HTTPS tunnel found')
    }
  } catch (error: any) {
    console.log(`   ❌ FAILED: ngrok not running`)
    console.log('   💡 Run: ngrok http 3000')
    allPassed = false
  }

  // Test 6: Webhook Endpoint
  console.log('\n🔗 Test 6: Webhook Endpoint')
  try {
    const response = await axios.get(`${API_URL}/webhooks/whatsapp`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': env.verifyToken,
        'hub.challenge': 'test_challenge'
      },
      timeout: 3000
    })
    if (response.data === 'test_challenge') {
      console.log('   ✅ Webhook verification working')
    } else {
      throw new Error('Unexpected response')
    }
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`)
    allPassed = false
  }

  // Test 7: Admin Endpoints
  console.log('\n⚙️  Test 7: Admin Endpoints')
  try {
    const [pending, doctors, followups, templates] = await Promise.all([
      axios.get(`${API_URL}/admin/appointments/pending`),
      axios.get(`${API_URL}/admin/appointments/doctors`),
      axios.get(`${API_URL}/admin/followups`),
      axios.get(`${API_URL}/admin/followups/templates`)
    ])
    console.log('   ✅ All admin endpoints working')
    console.log(`   📋 Pending appointments: ${pending.data.appointments?.length || 0}`)
    console.log(`   👨⚕️ Doctors: ${doctors.data.doctors?.length || 0}`)
    console.log(`   📨 Follow-ups: ${followups.data?.length || 0}`)
    console.log(`   📝 Templates: ${templates.data?.length || 0}`)
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`)
    allPassed = false
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED - System is healthy!\n')
    console.log('📋 Next Steps:')
    console.log('   1. Update webhook URL in Meta console with ngrok URL')
    console.log('   2. Ensure "messages" field is subscribed')
    console.log('   3. Add your phone to test numbers')
    console.log('   4. Send "hi" to WhatsApp Business number')
  } else {
    console.log('\n❌ SOME TESTS FAILED - Check errors above\n')
  }
  console.log('='.repeat(60) + '\n')
}

testSystem().catch(console.error)
