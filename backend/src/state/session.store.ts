export type BookingState =
  | 'idle'
  | 'booking_date'
  | 'booking_time'
  | 'booking_reason'

interface Session {
  state: BookingState
  data: {
    date?: string
    time?: string
    reason?: string
  }
}

const sessions = new Map<string, Session>()

export function getSession(phone: string): Session {
  return sessions.get(phone) || { state: 'idle', data: {} }
}

export function saveSession(phone: string, session: Session) {
  sessions.set(phone, session)
}

export function clearSession(phone: string) {
  sessions.delete(phone)
}