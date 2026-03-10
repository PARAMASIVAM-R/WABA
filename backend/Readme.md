# WhatsApp Appointment Booking System

A production-ready WhatsApp chatbot for booking doctor appointments using WhatsApp Business API with interactive menus, automated reminders, and self-service cancellation.

## 🎯 Key Features

### Patient Features
- **Service Menu** - Welcome menu with Book, Cancel, Reschedule, and Restart options
- **Interactive Booking** - Step-by-step appointment booking with WhatsApp buttons and lists
- **Instant Confirmation** - Patients confirm appointments directly (no manual approval needed)
- **Self-Service Cancellation** - Cancel appointments with 2-hour deadline policy
- **Self-Service Rescheduling** - Reschedule appointments with 2-hour deadline policy
- **Automated Reminders** - Daily reminders sent at 6 PM for next day appointments
- **Real-Time Availability** - Shows booked/capacity ratio for each time slot

### Admin Features
- **Dashboard** - View all appointments and statistics
- **Today's Visits** - Track daily appointments with status updates
- **Doctor Calendar** - Weekly view with seat management and patient details
- **Follow-up Management** - Send/resend follow-up messages to patients
- **Doctor Management** - Add, edit, and delete doctors
- **Time Slot Configuration** - Set custom time slots with capacity per doctor

## 📱 Complete Booking Flow

### 1. Service Menu (Entry Point)
```
User types: "hi" or "hello"
  ↓
Bot shows [Interactive Buttons]:
📋 Welcome! Choose a service:

[📅 Book] [❌ Cancel] [🔄 Reschedule] [🔁 Restart]

User clicks: [📅 Book]
```

### 2. Booking Process
```
Step 1: Select Category
Bot: [Interactive List] Medical Categories
User: Selects "Cardiology"

Step 2: Select Doctor
Bot: [Interactive List] Available Doctors
User: Selects "Dr. Michael Brown"

Step 3: Select Date
Bot: [Interactive List] Next 7 days
User: Selects "Tomorrow (15 Jan)"

Step 4: Select Time Slot
Bot: [Interactive List] Available slots with capacity
     Example: "10AM - 11AM [2/5]" (2 booked, 5 total)
User: Selects "10AM - 11AM [2/5]"

Step 5: Enter Name
Bot: "Please enter your full name: 👤"
User: Types "John Doe"

Step 6: Confirmation
Bot: Shows summary with interactive buttons:
     📋 Appointment Summary:
     👤 Name: John Doe
     🏥 Category: Cardiology
     👨⚕️ Doctor: Dr. Michael Brown
     📅 Date: Tomorrow (15 Jan)
     🕐 Time: 10AM - 11AM
     
     [✅ Confirm] [❌ Cancel]

User: Clicks "✅ Confirm"

Bot: ✅ Appointment Confirmed!
     Status: Confirmed
     Please arrive 10 minutes early.
     Thank you! 🙏
```

### 3. Cancellation Flow
```
User types: "cancel"
  ↓
Bot: [Interactive List] Your Appointments
     Example: "Dr. Anil Verma 15/01 9AM"
     (Only shows appointments >2 hours away)
  ↓
User: Selects appointment
  ↓
Bot: [Interactive Buttons]
     ⚠️ Cancel this appointment?
     Dr. Anil Verma
     15/01 at 9AM
     
     [✅ Yes, Cancel] [❌ No, Keep It]
  ↓
User: Clicks "✅ Yes, Cancel"
  ↓
Bot: ✅ Appointment cancelled successfully!
     The slot is now available for others.
```

### 4. Reschedule Flow
```
User clicks: [🔄 Reschedule]
  ↓
Bot: [Interactive List] Your Appointments
     Example: "Dr. Anil Verma 15/01 9AM"
     (Only shows appointments >2 hours away)
  ↓
User: Selects appointment
  ↓
Bot: [Interactive Buttons]
     🔄 Reschedule this appointment?
     
     Current Details:
     👨‍⚕️ Dr. Anil Verma
     📅 15/01
     🕐 9AM - 10AM
     
     [✅ Yes, Reschedule] [❌ No, Keep It]
  ↓
User: Clicks [✅ Yes, Reschedule]
  ↓
Bot: Starts booking flow:
     - [Interactive List] Select Category
     - [Interactive List] Select Doctor
     - [Interactive List] Select Date
     - [Interactive List] Select Time Slot (only available slots)
     (Name is auto-filled from existing appointment)
  ↓
Bot: [Interactive Buttons]
     🔄 Reschedule Confirmation:
     
     ❌ OLD:
     👨‍⚕️ Dr. Anil Verma
     📅 15/01
     🕐 9AM - 10AM
     
     ✅ NEW:
     👨‍⚕️ Dr. Michael Brown
     📅 16/01
     🕐 2PM - 3PM
     
     [✅ Confirm] [❌ Cancel]
  ↓
User: Clicks [✅ Confirm]
  ↓
Bot: ✅ Appointment Rescheduled Successfully!
     
     📋 New Details:
     👤 Name: John Doe
     🏥 Category: Cardiology
     👨‍⚕️ Doctor: Dr. Michael Brown
     📅 Date: 16/01
     🕐 Time: 2PM - 3PM
     
     Your appointment has been updated!
     Please arrive 10 minutes early. 🙏
```

### 5. Automated Reminders
```
Daily at 6 PM:
Bot sends to patients with appointments tomorrow:

🔔 Appointment Reminder

Hello [Patient Name]!

This is a reminder for your appointment:
👨⚕️ Doctor: Dr. Michael Brown
📅 Date: Tomorrow (15 Jan)
🕐 Time: 10AM - 11AM

📍 Please arrive 10 minutes early.

Need to cancel? Reply "cancel"
```

## 🗄️ Database Schema

### categories
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100) NOT NULL
```

### doctors
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100) NOT NULL
category_id INT NOT NULL (FK → categories.id)
```

### time_slots
```sql
id INT PRIMARY KEY AUTO_INCREMENT
doctor_id INT NOT NULL (FK → doctors.id)
date DATE NOT NULL
start_time TIME NOT NULL
end_time TIME NOT NULL
capacity INT NOT NULL DEFAULT 5
```

### appointments
```sql
id INT PRIMARY KEY AUTO_INCREMENT
phone VARCHAR(20) NOT NULL
name VARCHAR(100) NOT NULL
category VARCHAR(100) NOT NULL
doctor VARCHAR(100) NOT NULL
date DATE NOT NULL
time_slot VARCHAR(50) NOT NULL
status ENUM('pending', 'confirmed', 'accepted', 'visited', 'completed', 'cancelled') DEFAULT 'confirmed'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### followups
```sql
id INT PRIMARY KEY AUTO_INCREMENT
appointment_id INT NOT NULL (FK → appointments.id)
message TEXT NOT NULL
status ENUM('pending', 'sent') DEFAULT 'pending'
sent_at TIMESTAMP NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js v16+
- MySQL 5.7+ or 8.0+
- WhatsApp Business API account
- ngrok account (free tier works)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Setup MySQL Database
```sql
CREATE DATABASE WABA;
```

### 4. Get WhatsApp Credentials
1. Go to https://developers.facebook.com/apps
2. Create/select app → **WhatsApp** → **API Setup**
3. Copy:
   - **Phone Number ID**
   - **Access Token**

### 5. Configure Environment
Create `.env`:
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

### 6. Setup Database
```bash
npx ts-node src/setup-db.ts
```

### 7. Test API Credentials
```bash
npx ts-node src/test-api.ts
```
Expected: `✅ SUCCESS! API is working`

### 8. Setup Webhook

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

### 9. Test on WhatsApp
1. Add your phone to test numbers in Meta
2. Send "hi" to your WhatsApp Business number
3. Follow the interactive booking flow!

## 🎨 Admin Dashboard Features

### Dashboard Tab
- View all appointments
- Filter by date range (From/To dates)
- Quick navigation: Previous Week, This Week, Next Week
- Add time slots with custom capacity
- Time picker with AM/PM format

### Today's Visits Tab
- View today's appointments
- Update status: Pending → Accepted → Visited → Completed
- Color-coded status badges:
  - Completed: Green
  - Visited: Blue
  - Accepted: Yellow
  - Confirmed: Light Blue
  - Pending: Purple
  - Cancelled: Red

### Doctor Calendar Tab
- Weekly calendar view per doctor
- Visual seat boxes showing patient names
- Status-based color coding
- Refresh button to reload data
- Empty slots show "No slot added"

### Follow-ups Tab
- View all follow-up messages
- Send/Resend follow-up messages
- Track sent status with timestamp
- Button changes: "📤 Send" (green) → "🔄 Resend" (blue)

### Doctor Management
- Add new doctors with category selection
- Edit existing doctor details
- Delete doctors (with confirmation)

## 🔧 Key Technical Features

### Session Management
- In-memory session store per phone number
- Tracks conversation state and booking data
- Auto-clears after completion or cancellation
- Supports restart at any point

### Time Format
- WhatsApp display: "10AM - 11AM [2/5]"
- Database storage: "10AM - 11AM"
- Admin UI: AM/PM dropdowns (hour 1-12, minute 00-59)

### Capacity Management
- Real-time booking count per slot
- Only shows slots with available capacity
- Counts confirmed, accepted, visited, completed statuses
- Excludes cancelled appointments

### Cancellation Policy
- 2-hour deadline before appointment time
- Only shows cancellable appointments
- Filters past dates automatically
- Frees up slot capacity immediately

### Rescheduling Policy
- 2-hour deadline before appointment time
- Only shows reschedulable appointments
- Shows only available slots (excludes full slots)
- Filters past time slots for today
- Updates existing appointment (same ID)
- Old slot freed, new slot booked
- No name re-entry required

### Automated Reminders
- Cron job runs daily at 6 PM (schedule: '0 18 * * *')
- Sends reminders for next day appointments
- Includes patient name, doctor, date, time
- Provides cancel option

## 🛠️ Available Scripts

```bash
npm run dev                      # Start development server
npx ts-node src/setup-db.ts      # Setup/reset database
npx ts-node src/test-api.ts      # Test WhatsApp API
npx ts-node src/test-reminder.ts # Test reminder service manually
```

## 📊 Appointment Status Flow

```
Patient books → confirmed
     ↓
Admin accepts → accepted
     ↓
Patient arrives → visited
     ↓
Consultation done → completed

OR

Patient cancels → cancelled
```

## 🔐 Security Best Practices

- ✅ Never commit `.env` file
- ✅ Rotate access tokens regularly
- ✅ Use permanent tokens for production
- ✅ Validate webhook signatures
- ✅ Implement rate limiting
- ✅ Add authentication for admin endpoints

## 📝 Production Considerations

- Replace in-memory sessions with Redis
- Add database connection pooling
- Implement proper error logging (Winston/Pino)
- Add request validation middleware
- Set up monitoring (Sentry/DataDog)
- Use PM2 for process management
- Add unit and integration tests

## 📚 Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- MySQL 8.0
- node-cron (automated reminders)

**Frontend:**
- React + Vite
- Tailwind CSS
- Axios

**WhatsApp:**
- Meta Business API
- Interactive Lists & Buttons

**Tools:**
- ngrok (webhook tunneling)
- ts-node-dev (development)

## 📖 Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Interactive Messages Guide](https://developers.facebook.com/docs/whatsapp/guides/interactive-messages)
- [ngrok Documentation](https://ngrok.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

**Built with ❤️ for seamless appointment booking via WhatsApp**
