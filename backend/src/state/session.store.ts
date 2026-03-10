export type BookingState =
  | 'idle'
  | 'booking_category'
  | 'booking_doctor'
  | 'booking_date'
  | 'booking_time'
  | 'booking_name'
  | 'booking_confirm'
  | 'cancel_appointment'
  | 'cancel_confirm'
  | 'cancel_final'
  | 'reschedule_select'
  | 'reschedule_confirm'
  | 'reschedule_start'
  | 'reschedule_category'
  | 'reschedule_doctor'
  | 'reschedule_date'
  | 'reschedule_time'
  | 'reschedule_final'

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
    cancelId: number | undefined
    rescheduleId: number | undefined
    oldDoctor: string | undefined
    oldDate: string | undefined
    oldTime: string | undefined
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
      name: undefined,
      cancelId: undefined,
      rescheduleId: undefined,
      oldDoctor: undefined,
      oldDate: undefined,
      oldTime: undefined
    }
  }
}

export function saveSession(phone: string, session: Session) {
  sessions.set(phone, session)
}

export function clearSession(phone: string) {
  sessions.delete(phone)
}