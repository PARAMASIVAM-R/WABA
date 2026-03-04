export type BookingState =
  | 'idle'
  | 'booking_category'
  | 'booking_doctor'
  | 'booking_date'
  | 'booking_time'
  | 'booking_name'

interface Session {
  state: BookingState
  data: {
    category: string | undefined
    doctor: string | undefined
    date: string | undefined
    dateDisplay: string | undefined
    time: string | undefined
    timeSlotId: number | undefined
    name: string | undefined
  }
}

const sessions = new Map<string, Session>()

export function getSession(phone: string): Session {
  return sessions.get(phone) || { 
    state: 'idle', 
    data: {
      category: undefined,
      doctor: undefined,
      date: undefined,
      dateDisplay: undefined,
      time: undefined,
      timeSlotId: undefined,
      name: undefined
    }
  }
}

export function saveSession(phone: string, session: Session) {
  sessions.set(phone, session)
}

export function clearSession(phone: string) {
  sessions.delete(phone)
}