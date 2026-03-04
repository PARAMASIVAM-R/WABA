# Migration to Capacity-Based Session System

## Overview
This migration replaces the 30-minute interval slot system with capacity-based session windows.

## Key Changes

### 1. Data Model
- **Old**: `time_slots` table with `is_booked` flag
- **New**: `session_windows` table with `capacity` and `booked_count`
- **Old**: `appointments` table
- **New**: `bookings` table with unique `token_id`

### 2. Token System
- Format: `DRM-YYYYMMDD-XXXX` (e.g., `DRM-20260303-7K2Q`)
- Unique token generated for each booking
- Collision-checked with database unique index

### 3. Session Windows
- One session can accept multiple patients (capacity-based)
- Example: 10:00 AM session with capacity 5 can accept 5 patients
- Display shows: "10:00 AM (3/5 booked)"

### 4. Today's Appointments Page
- New page showing all today's accepted appointments
- Grouped by doctor and session time
- "Mark Visited" button to track patient arrivals
- Visited patients shown with token ID

## Migration Steps

### Backend

1. **Run Migration Script**
   ```bash
   cd backend
   npm run migrate
   ```

2. **Verify Database**
   - Check `session_windows` table exists
   - Check `bookings` table exists with `token_id` column
   - Verify unique index on `token_id`

3. **Start Backend**
   ```bash
   npm run dev
   ```

### Frontend

1. **Install Dependencies** (if needed)
   ```bash
   cd frontend
   npm install
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

## New Features

### Admin Dashboard

1. **Today's Visits Tab**
   - View all today's accepted appointments
   - Grouped by doctor and session
   - Mark patients as visited
   - Track attendance

2. **Doctors Management**
   - Sessions show capacity: "(3/5 booked)"
   - Add sessions with custom capacity
   - Edit session time and capacity

3. **Appointments View**
   - Token column added
   - Shows unique token for each booking

### Patient Booking Flow

1. **Session Selection**
   - Shows available capacity
   - Example: "10:00 AM (2/5 booked)"
   - Prevents booking if session is full

2. **Token Generation**
   - Automatic unique token on booking
   - Token sent in confirmation message
   - Used for check-in at hospital

## API Changes

### New Endpoints

- `GET /admin/appointments/today` - Get today's appointments
- `POST /admin/appointments/:id/visited` - Mark as visited
- `GET /admin/appointments/doctors/:id/sessions` - Get doctor sessions
- `POST /admin/appointments/doctors/:id/sessions` - Create session
- `PUT /admin/appointments/sessions/:id` - Update session
- `DELETE /admin/appointments/sessions/:id` - Delete session
- `GET /admin/appointments/sessions/:id/bookings` - Get session bookings

### Modified Endpoints

- `GET /admin/appointments/pending` - Returns bookings with tokens
- `POST /admin/appointments/:id/accept` - Includes token in response
- `POST /admin/appointments/:id/reject` - Decrements booked_count

## Database Schema

### session_windows
```sql
CREATE TABLE session_windows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 5,
  booked_count INT NOT NULL DEFAULT 0,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  UNIQUE KEY unique_session (doctor_id, slot_date, start_time)
)
```

### bookings
```sql
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  patient_name VARCHAR(100) NOT NULL,
  token_id VARCHAR(50) NOT NULL UNIQUE,
  window_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'visited') DEFAULT 'pending',
  rejection_reason TEXT NULL,
  visited_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (window_id) REFERENCES session_windows(id),
  INDEX idx_token (token_id),
  INDEX idx_status (status)
)
```

## Testing

1. **Create a booking via WhatsApp**
   - Verify token is generated
   - Check token format: `DRM-YYYYMMDD-XXXX`

2. **Accept booking in admin**
   - Verify token appears in appointments list
   - Check WhatsApp confirmation includes token

3. **Check Today's Appointments**
   - Navigate to "Today's Visits" tab
   - Verify bookings are grouped by session
   - Test "Mark Visited" functionality

4. **Test Session Capacity**
   - Create session with capacity 2
   - Book 2 appointments
   - Verify 3rd booking shows "session full"

## Rollback

If issues occur, restore from backup:
```bash
# Restore database backup
mysql -u root -p hospital_db < backup.sql
```

## Support

For issues or questions, check:
- Backend logs: `backend/` directory
- Frontend console: Browser DevTools
- Database: Check `session_windows` and `bookings` tables
