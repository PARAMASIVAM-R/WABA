# WhatsApp Appointment Booking Bot

A production-ready WhatsApp chatbot for booking doctor appointments using WhatsApp Business API with interactive menus and MySQL database.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment variables & validation
│   │   └── whatsapp.ts         # WhatsApp configurations (reserved)
│   ├── routes/
│   │   ├── whatsapp.route.ts   # WhatsApp webhook endpoints
│   │   ├── appointments.route.ts # View appointments API
│   │   └── invite.route.ts     # Send messages API
│   ├── services/
│   │   ├── whatsapp.service.ts # WhatsApp API integration
│   │   ├── booking.service.ts  # Booking conversation flow
│   │   └── db.service.ts       # MySQL database operations
│   ├── state/
│   │   └── session.store.ts    # In-memory session management
│   ├── utils/
│   │   └── webhook.util.ts     # Webhook payload parser
│   ├── app.ts                  # Express app configuration
│   ├── server.ts               # Server entry point with DB init
│   ├── seed.ts                 # Database seeding script
│   ├── fix-table.ts            # Database migration helper
│   └── test-api.ts             # API credentials tester
├── .env                        # Environment variables (DO NOT COMMIT)
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🎯 File Purposes

### **Core Application**
- **server.ts** - Initializes database and starts Express server
- **app.ts** - Configures Express middleware and registers all routes
- **test-api.ts** - Validates WhatsApp API credentials

### **Configuration**
- **config/env.ts** - Loads and validates environment variables (WhatsApp + MySQL)
- **.env** - Stores sensitive credentials (never commit!)

### **Routes (API Endpoints)**
- **routes/whatsapp.route.ts** 
  - `GET /webhooks/whatsapp` - Webhook verification
  - `POST /webhooks/whatsapp` - Receive WhatsApp messages
  - `POST /webhooks/whatsapp/test` - Test endpoint with response
  
- **routes/appointments.route.ts**
  - `GET /appointments` - View all appointments
  - `GET /appointments/:phone` - View appointments by phone number
  
- **routes/invite.route.ts**
  - `POST /invite/send` - Send text messages to users

### **Services (Business Logic)**
- **services/whatsapp.service.ts** - WhatsApp API functions:
  - `sendText()` - Send plain text messages
  - `sendInteractiveList()` - Send selectable lists
  - `sendInteractiveButtons()` - Send clickable buttons
  
- **services/booking.service.ts** - Appointment booking flow:
  - Manages 6-step conversation (category → doctor → date → time → reason → confirm)
  - Validates user selections
  - Generates dynamic date options (next 7 days)
  - Fetches doctors and time slots from database
  
- **services/db.service.ts** - MySQL database operations:
  - `initDB()` - Creates tables on startup
  - `getCategories()` - Fetch medical categories
  - `getDoctorsByCategory()` - Fetch doctors by category
  - `getTimeSlotsByDoctor()` - Fetch available time slots
  - `saveAppointment()` - Store booking in database
  - `getAppointments()` - Retrieve all appointments
  - `getAppointmentsByPhone()` - Retrieve user's appointments

### **State Management**
- **state/session.store.ts** - In-memory session storage:
  - Tracks conversation state per user
  - Stores temporary booking data (category, doctor, date, time, reason)
  - Clears session after successful booking

### **Utilities**
- **utils/webhook.util.ts** - Parses WhatsApp webhook payloads:
  - Extracts text messages
  - Extracts interactive list/button responses

### **Database Scripts**
- **seed.ts** - Populates database with sample data (5 categories, 7 doctors, time slots)
- **fix-table.ts** - Recreates appointments table with correct schema

## 🗄️ Database Schema

### **categories**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100) NOT NULL
```

### **doctors**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100) NOT NULL
category_id INT NOT NULL (FK → categories.id)
```

### **time_slots**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
doctor_id INT NOT NULL (FK → doctors.id)
time VARCHAR(20) NOT NULL
```

### **appointments**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
phone VARCHAR(20) NOT NULL
category VARCHAR(100) NOT NULL
doctor VARCHAR(100) NOT NULL
date VARCHAR(50) NOT NULL
time VARCHAR(50) NOT NULL
reason TEXT NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## 🚀 Setup Instructions

### **1. Prerequisites**
- Node.js v16+
- MySQL 5.7+ or 8.0+
- WhatsApp Business API account
- ngrok account (free tier works)

### **2. Install Dependencies**
```bash
cd backend
npm install
```

### **3. Setup MySQL Database**
```sql
CREATE DATABASE WABA;
```

### **4. Get WhatsApp Credentials**
1. Go to https://developers.facebook.com/apps
2. Create/select app → **WhatsApp** → **API Setup**
3. Copy:
   - **Phone Number ID**
   - **Access Token** (Generate Access Token button)

### **5. Configure Environment**
Edit `.env`:
```env
PORT=3000
WHATSAPP_VERIFY_TOKEN=PARAMAA007
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=WABA
```

### **6. Seed Database**
```bash
npm run seed
```
This creates 5 categories, 7 doctors, and time slots (9 AM - 4 PM).

### **7. Test API Credentials**
```bash
npx ts-node src/test-api.ts
```
Expected: `✅ SUCCESS! API is working`

### **8. Setup Webhook**
 npx ts-node src/setup-db.ts  -- for setup/ reset database tables

**Terminal 1 - Start Server:**
```bash
npm run dev
```

**Terminal 2 - Start ngrok:**
```bash
ngrok http 3000
```
Copy HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

**Configure in Meta:**
1. https://developers.facebook.com/apps
2. Your app → **WhatsApp** → **Configuration**
3. **Edit** Webhook
4. Callback URL: `https://abc123.ngrok-free.app/webhooks/whatsapp`
5. Verify Token: `PARAMAA007`
6. **Verify and Save**
7. Subscribe to **messages**

### **9. Test on WhatsApp**
1. Add your phone to test numbers in Meta
2. Send "hi" to your WhatsApp Business number
3. Follow the interactive booking flow!

## 📱 Conversation Flow

```
User: "hi"
  ↓
Bot: "👋 Welcome! I can help you book a doctor appointment."
Bot: [Interactive List] Select Category
  ↓
User: Selects "Cardiology"
  ↓
Bot: [Interactive List] Select Doctor (Dr. Michael Brown, Dr. Emily Davis)
  ↓
User: Selects "Dr. Michael Brown"
  ↓
Bot: [Interactive List] Select Date (Today, Tomorrow, + 5 more days)
  ↓
User: Selects "Tomorrow"
  ↓
Bot: [Interactive List] Select Time (9:00 AM - 4:00 PM slots)
  ↓
User: Selects "10:00 AM"
  ↓
Bot: "⏰ Time confirmed! What is the reason for your visit? 🏥"
  ↓
User: Types "Regular checkup"
  ↓
Bot: "✅ Appointment Confirmed!
      📋 Summary:
      🏥 Category: Cardiology
      👨⚕️ Doctor: Dr. Michael Brown
      📅 Date: tomorrow
      🕐 Time: 10:00 AM
      💬 Reason: Regular checkup
      Thank you! See you soon! 🙏"
```

## 🔌 API Endpoints

### **WhatsApp Webhook**
- `GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=PARAMAA007&hub.challenge=test`
  - Webhook verification by Meta
  
- `POST /webhooks/whatsapp`
  - Receives WhatsApp messages
  - Returns 200 OK immediately
  
- `POST /webhooks/whatsapp/test`
  - Test endpoint that returns bot response

### **Appointments**
- `GET /appointments`
  - Returns all appointments
  
- `GET /appointments/916379773448`
  - Returns appointments for specific phone

### **Messaging**
- `POST /invite/send`
  - Body: `{ "phone": "916379773448", "message": "Hello!" }`
  - Sends text message to user

## 🧪 Testing

### **Postman - Simulate WhatsApp Message**
```
POST http://localhost:3000/webhooks/whatsapp/test
Content-Type: application/json

{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "916379773448",
          "type": "text",
          "text": { "body": "hi" }
        }]
      }
    }]
  }]
}
```

### **View Appointments**
```
GET http://localhost:3000/appointments
```

## 🔧 Troubleshooting

### **No response in WhatsApp**
1. Check server logs for errors
2. Verify token: `npx ts-node src/test-api.ts`
3. Check ngrok: `http://127.0.0.1:4040`
4. Ensure webhook subscribed to "messages"
5. Restart server after code changes

### **Database errors**
```bash
npx ts-node src/fix-table.ts
npm run seed
```

### **Webhook verification fails**
- Server must be running
- Verify token must match `.env`
- Use HTTPS URL from ngrok
- Check ngrok auth token configured

### **Access token expired**
- Temporary tokens expire in 24 hours
- Generate new token from Meta Developer Console
- Update `.env` and restart server

## 📊 Sample Data

**Categories:** General Medicine, Cardiology, Dermatology, Pediatrics, Orthopedics

**Doctors:**
- Dr. John Smith (General Medicine)
- Dr. Sarah Johnson (General Medicine)
- Dr. Michael Brown (Cardiology)
- Dr. Emily Davis (Cardiology)
- Dr. David Wilson (Dermatology)
- Dr. Lisa Anderson (Pediatrics)
- Dr. Robert Taylor (Orthopedics)

**Time Slots:** 9:00 AM, 10:00 AM, 11:00 AM, 2:00 PM, 3:00 PM, 4:00 PM

## 🔐 Security Best Practices

- ✅ Never commit `.env` file
- ✅ Rotate access tokens regularly
- ✅ Use permanent tokens for production (System User)
- ✅ Validate webhook signatures in production
- ✅ Use environment variables for all secrets
- ✅ Implement rate limiting for production
- ✅ Add authentication for admin endpoints

## 📝 Production Considerations

- Replace in-memory sessions with Redis
- Add database connection pooling
- Implement proper error logging (Winston/Pino)
- Add request validation middleware
- Set up monitoring (Sentry/DataDog)
- Use PM2 for process management
- Add unit and integration tests
- Implement appointment cancellation
- Add reminder notifications
- Create admin dashboard

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server with auto-reload
npm run seed     # Populate database with sample data
npx ts-node src/test-api.ts    # Test WhatsApp API credentials
npx ts-node src/fix-table.ts   # Fix appointments table schema
```

## 📚 Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MySQL 8.0
- **WhatsApp:** Meta Business API
- **Tools:** ngrok, ts-node-dev
- **Libraries:** axios, mysql2, dotenv

## 📖 Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Interactive Messages Guide](https://developers.facebook.com/docs/whatsapp/guides/interactive-messages)
- [ngrok Documentation](https://ngrok.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

ISC

---

**Built with ❤️ for seamless appointment booking via WhatsApp**
