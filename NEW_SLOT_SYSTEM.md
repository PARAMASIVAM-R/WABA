# New Slot & Token System

## Overview
The system has been updated to use a **virtual slot system** with **token-based queuing**.

---

## How It Works

### 1. **Doctor Configuration**
When adding a doctor, admin sets:
- **Slots per day**: Number of time slots (e.g., 4 slots = Morning, Afternoon, Evening, Night)
- **Patients per slot**: Maximum patients per time slot (e.g., 5 patients)
- **Start time**: When the doctor starts work (e.g., 09:00 AM)

Example:  hhhh
```
Doctor: Dr. Smith
Slots per day: 4
Patients per slot: 5
Start time: 09:00 AM

This means:
- Slot 1: 09:00 AM - 5 patients max
- Slot 2: 11:00 AM - 5 patients max
- Slot 3: 02:00 PM - 5 patients max
- Slot 4: 04:00 PM - 5 patients max
```

---

### 2. **Patient Booking Flow**

**Step 1: Patient books via WhatsApp**
- Selects category, doctor, date, time slot
- Appointment status: `PENDING`

**Step 2: Admin reviews and accepts**
- Admin sees pending appointment in dashboard
- Clicks "Accept" button
- Appointment status: `ACCEPTED`
- Patient receives confirmation message

**Step 3: On appointment date**
- Patient arrives at hospital
- Receptionist marks patient as "Visited"
- System assigns token number automatically
- Appointment status: `VISITED`
- Patient receives token via WhatsApp

---

### 3. **Token Assignment Logic**

```javascript
// Example: Dr. Smith, 10:00 AM slot, Max 5 patients

Patient 1 arrives → Mark Visited → Token #1
Patient 2 arrives → Mark Visited → Token #2
Patient 3 arrives → Mark Visited → Token #3
Patient 4 arrives → Mark Visited → Token #4
Patient 5 arrives → Mark Visited → Token #5
Patient 6 arrives → ERROR: Slot is full
```

---

### 4. **Database Changes**

**doctors table:**
```sql
ALTER TABLE doctors 
ADD COLUMN slots_per_day INT DEFAULT 4,
ADD COLUMN patients_per_slot INT DEFAULT 5,
ADD COLUMN start_time TIME DEFAULT '09:00:00'
```

**appointments table:**
```sql
ALTER TABLE appointments 
ADD COLUMN token_number INT DEFAULT NULL
```

**Removed:**
- `time_slots` table (no longer needed)

---

### 5. **API Changes**

**New Endpoint:**
```
POST /admin/appointments/:id/visited
- Marks patient as visited
- Assigns token number
- Sends WhatsApp notification with token
```

**Updated Endpoint:**
```
POST /admin/appointments/doctors
Body: {
  name: "Dr. Smith",
  categoryId: 1,
  slotsPerDay: 4,
  patientsPerSlot: 5,
  startTime: "09:00"
}
```

---

### 6. **UI Changes**

**Dashboard - Doctors Tab:**
- Shows: ID, Name, Category, Slots/Day, Patients/Slot, Start Time
- Removed: Slot management UI (Add/Edit/Delete slots)

**Dashboard - Appointments Tab:**
- Added: Token column
- Added: "Mark Visited" button (only for accepted appointments)
- Status colors:
  - Pending: Yellow
  - Accepted: Green
  - Visited: Blue
  - Rejected: Red

---

### 7. **Migration Steps**

1. Run migration script:
```bash
npx ts-node src/migrate-slot-system.ts
```

2. Update existing doctors with slot configuration:
```sql
UPDATE doctors SET 
  slots_per_day = 4,
  patients_per_slot = 5,
  start_time = '09:00:00'
WHERE slots_per_day IS NULL;
```

---

### 8. **Benefits**

✅ **Flexible**: No need to pre-create time slots
✅ **Scalable**: Handles any number of appointments
✅ **Simple**: Token assigned only when patient arrives
✅ **Efficient**: No slot booking/unbooking complexity
✅ **Fair**: First-come-first-served within each time slot

---

### 9. **Example Workflow**

**Day 1: Booking**
```
10:00 AM - Patient A books for tomorrow 10:00 AM
11:00 AM - Patient B books for tomorrow 10:00 AM
12:00 PM - Patient C books for tomorrow 10:00 AM
```

**Day 2: Appointment Day**
```
09:45 AM - Patient A arrives → Receptionist marks visited → Token #1
09:50 AM - Patient C arrives → Receptionist marks visited → Token #2
10:05 AM - Patient B arrives → Receptionist marks visited → Token #3
```

Tokens are assigned in order of arrival, not booking order!

---

### 10. **Error Handling**

**Slot Full:**
```
If 5 patients already have tokens for 10:00 AM slot,
6th patient cannot be marked as visited.
Error: "Slot is full"
```

**Solution:** Admin can:
1. Reject the appointment with reason
2. Suggest alternate time slot
3. Increase patients_per_slot for that doctor

---

## Summary

The new system eliminates the need for pre-created time slots and uses a **virtual slot system** where:
- Doctors have configuration (slots/day, patients/slot, start time)
- Appointments are accepted but not "booked" until patient arrives
- Tokens are assigned on arrival in FIFO order
- System prevents overbooking by checking patient count per slot

This is more flexible and realistic for hospital operations! 🏥
