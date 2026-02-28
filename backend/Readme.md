# WhatsApp Appointment Booking Bot

A WhatsApp chatbot for booking doctor appointments using WhatsApp Business API with interactive menus.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment variables configuration
│   │   └── whatsapp.ts         # WhatsApp-specific configurations (empty)
│   ├── routes/
│   │   ├── whatsapp.route.ts   # Webhook endpoints for WhatsApp
│   │   └── invite.route.ts     # API to send template invitations
│   ├── services/
│   │   ├── whatsapp.service.ts # WhatsApp API functions (send messages, lists, buttons)
│   │   └── booking.service.ts  # Appointment booking logic & conversation flow
│   ├── state/
│   │   └── session.store.ts    # In-memory session management for users
│   ├── types/
│   │   └── whatsapp.types.ts   # TypeScript type definitions (empty)
│   ├── utils/
│   │   └── webhook.util.ts     # Extract messages from WhatsApp webhook payload
│   ├── app.ts                  # Express app setup & routes
│   ├── server.ts               # Server entry point
│   └── test-api.ts             # Test script to verify WhatsApp API credentials
├── .env                        # Environment variables (credentials)
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🎯 File Purposes

### **Core Files**

- **server.ts** - Starts the Express server on specified port
- **app.ts** - Configures Express middleware and routes
- **test-api.ts** - Quick test to verify WhatsApp API token is valid

### **Configuration**

- **config/env.ts** - Loads and validates environment variables from .env file
- **.env** - Stores WhatsApp credentials (never commit this!)

### **Routes**

- **routes/whatsapp.route.ts** - Handles incoming WhatsApp webhooks (GET for verification, POST for messages)
- **routes/invite.route.ts** - API endpoint to send template messages to initiate conversations

### **Services**

- **services/whatsapp.service.ts** - Functions to send messages via WhatsApp API:
  - `sendText()` - Send plain text messages
  - `sendInteractiveList()` - Send selectable lists (dates, times)
  - `sendInteractiveButtons()` - Send clickable buttons
  
- **services/booking.service.ts** - Appointment booking conversation flow:
  - Manages conversation states (idle → date → time → reason → confirm)
  - Generates next 7 days for date selection
  - Processes user responses

### **State Management**

- **state/session.store.ts** - In-memory storage for user conversation state:
  - Tracks which step user is on
  - Stores appointment data (date, time, reason)
  - Clears session after booking

### **Utilities**

- **utils/webhook.util.ts** - Extracts message data from WhatsApp webhook payload:
  - Handles text messages
  - Handles interactive list/button responses

## 🚀 Setup Instructions

### **1. Prerequisites**

- Node.js (v16+)
- WhatsApp Business API account
- ngrok account (free)

### **2. Install Dependencies**

```bash
cd backend
npm install
```

### **3. Get WhatsApp Credentials**

1. Go to https://developers.facebook.com/apps
2. Create/select your app → **WhatsApp** → **API Setup**
3. Copy these values:
   - **Phone Number ID**
   - **Access Token** (click "Generate Access Token")

### **4. Configure Environment**

Edit `.env` file:

```env
PORT=3000
WHATSAPP_VERIFY_TOKEN=PARAMAA007
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

### **5. Test API Credentials**

```bash
npx ts-node src/test-api.ts
```

You should see: `✅ SUCCESS! API is working`

### **6. Setup Webhook**

**Terminal 1 - Start Server:**
```bash
npm run dev
```

**Terminal 2 - Start ngrok:**
```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

**Configure in Meta:**
1. Go to https://developers.facebook.com/apps
2. Your app → **WhatsApp** → **Configuration**
3. Click **Edit** on Webhook
4. Callback URL: `https://abc123.ngrok-free.app/webhooks/whatsapp`
5. Verify Token: `PARAMAA007`
6. Click **Verify and Save**
7. Subscribe to **messages**

### **7. Test on WhatsApp**

1. Add your phone number to test numbers in Meta
2. Send "hello" to your WhatsApp Business number
3. Bot will respond with interactive date selection!

## 📱 Conversation Flow

1. **User:** "hello"
2. **Bot:** Interactive list with next 7 days
3. **User:** Selects date
4. **Bot:** Interactive list with time slots (9 AM - 4 PM)
5. **User:** Selects time
6. **Bot:** Asks for reason (text input)
7. **User:** Types reason
8. **Bot:** Confirms appointment with summary

## 🧪 Testing

### **Test with Postman**

**Endpoint:** `POST http://localhost:3000/webhooks/whatsapp/test`

**Body:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "916379773448",
          "type": "text",
          "text": { "body": "hello" }
        }]
      }
    }]
  }]
}
```

### **Send Template Invitation**

**Endpoint:** `POST http://localhost:3000/invite/send`

**Body:**
```json
{
  "phone": "916379773448",
  "templateName": "hello_world"
}
```

## 🔧 Troubleshooting

### **No response in WhatsApp**

1. Check server logs for errors
2. Verify access token: `npx ts-node src/test-api.ts`
3. Check ngrok dashboard: `http://127.0.0.1:4040`
4. Ensure webhook is subscribed to "messages"

### **Webhook verification fails**

1. Ensure server is running
2. Check verify token matches in .env and Meta
3. Use HTTPS URL from ngrok (not HTTP)

### **Access token expired**

Temporary tokens expire in 24 hours. Generate a new one from Meta Developer Console.

## 📝 Notes

- Sessions are stored in-memory (lost on server restart)
- For production, use Redis or database for session storage
- WhatsApp lists support max 10 items per section
- Free ngrok requires auth token to avoid browser warning

## 🔐 Security

- Never commit `.env` file
- Rotate access tokens regularly
- Use permanent tokens for production (via System User)
- Validate webhook signatures in production

## 📚 Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Interactive Messages Guide](https://developers.facebook.com/docs/whatsapp/guides/interactive-messages)
- [ngrok Documentation](https://ngrok.com/docs)


# The key was: You needed to restart the server after making code changes. ts-node-dev should auto-reload, but sometimes it doesn't detect changes properly.
