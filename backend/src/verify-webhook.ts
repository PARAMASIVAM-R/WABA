import axios from 'axios'

async function verifyWebhookSetup() {
  console.log('\n🔍 WEBHOOK CONFIGURATION CHECKER\n')
  console.log('='.repeat(70))

  try {
    // Get ngrok URL
    console.log('\n1️⃣ Checking ngrok tunnel...')
    const ngrokRes = await axios.get('http://127.0.0.1:4040/api/tunnels')
    const tunnel = ngrokRes.data.tunnels.find((t: any) => t.proto === 'https')
    
    if (!tunnel) {
      console.log('   ❌ No HTTPS tunnel found')
      console.log('   💡 Run: ngrok http 3000')
      return
    }
    
    const ngrokUrl = tunnel.public_url
    console.log(`   ✅ ngrok URL: ${ngrokUrl}`)
    console.log(`   📊 Total requests: ${tunnel.metrics.http.count}`)

    // Test webhook verification
    console.log('\n2️⃣ Testing webhook verification endpoint...')
    const webhookUrl = `${ngrokUrl}/webhooks/whatsapp`
    const verifyRes = await axios.get(webhookUrl, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'PARAMAA007',
        'hub.challenge': 'test_challenge_12345'
      }
    })
    
    if (verifyRes.data === 'test_challenge_12345') {
      console.log('   ✅ Webhook verification working')
    } else {
      console.log('   ❌ Unexpected response:', verifyRes.data)
    }

    // Test POST endpoint
    console.log('\n3️⃣ Testing webhook POST endpoint...')
    const testPayload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '919999999999',
              type: 'text',
              text: { body: 'test' }
            }]
          }
        }]
      }]
    }
    
    const postRes = await axios.post(`${webhookUrl}/test`, testPayload)
    console.log('   ✅ POST endpoint working')

    // Instructions
    console.log('\n' + '='.repeat(70))
    console.log('\n📋 CONFIGURATION CHECKLIST:\n')
    console.log('1. Go to: https://developers.facebook.com/apps')
    console.log('2. Select your app → WhatsApp → Configuration')
    console.log('3. Click "Edit" next to Callback URL')
    console.log(`4. Enter: ${webhookUrl}`)
    console.log('5. Verify Token: PARAMAA007')
    console.log('6. Click "Verify and Save"')
    console.log('7. Scroll down to "Webhook fields"')
    console.log('8. Make sure "messages" is checked ✅')
    console.log('9. Click "Subscribe"')
    console.log('\n📱 TEST STEPS:\n')
    console.log('1. Go to WhatsApp → API Setup')
    console.log('2. Under "To", click "Manage phone number list"')
    console.log('3. Add your phone: +916379773448')
    console.log('4. Send "hi" to your WhatsApp Business number')
    console.log('5. Check server logs for incoming webhook')
    console.log('\n💡 DEBUGGING:\n')
    console.log('- Check ngrok dashboard: http://127.0.0.1:4040')
    console.log('- Look for POST requests to /webhooks/whatsapp')
    console.log('- If no requests, webhook URL is wrong in Meta')
    console.log('- If requests but no logs, check server is running')
    console.log('\n' + '='.repeat(70) + '\n')

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure:')
      console.log('   - Server is running: npm run dev')
      console.log('   - ngrok is running: ngrok http 3000')
    }
  }
}

verifyWebhookSetup().catch(console.error)
