import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(__dirname, '../../appointments.json')

interface Appointment {
  id: string
  phone: string
  date: string
  time: string
  reason: string
  createdAt: string
}

function readDB(): Appointment[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, '[]')
      return []
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeDB(appointments: Appointment[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(appointments, null, 2))
}

export function saveAppointment(phone: string, date: string, time: string, reason: string) {
  const appointments = readDB()
  const newAppointment: Appointment = {
    id: Date.now().toString(),
    phone,
    date,
    time,
    reason,
    createdAt: new Date().toISOString()
  }
  appointments.push(newAppointment)
  writeDB(appointments)
  console.log('💾 Appointment saved to database:', newAppointment.id)
  return newAppointment
}

export function getAppointments() {
  return readDB()
}

export function getAppointmentsByPhone(phone: string) {
  return readDB().filter(apt => apt.phone === phone)
}
