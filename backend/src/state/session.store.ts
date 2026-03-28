import Redis from 'ioredis'
import { env } from '../config/env'

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

export interface Session {
  state: BookingState
  hospital_id: number
  data: {
    category?: string
    doctor?: string
    date?: string
    dateDisplay?: string
    time?: string
    timeSlotId?: number
    name?: string
    cancelId?: number
    rescheduleId?: number
    oldDoctor?: string
    oldDate?: string
    oldTime?: string
  }
}

const SESSION_TTL = 60 * 30 // 30 minutes

// ── In-memory fallback ────────────────────────────────────────────────────────
const memoryStore = new Map<string, Session>()

function emptySession(): Session {
  return { state: 'idle', hospital_id: 0, data: {} }
}

// ── Redis (optional) ──────────────────────────────────────────────────────────
let redis: Redis | null = null
let redisReady = false

function initRedis() {
  const client = new Redis(env.redisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null, // don't retry — fall back to memory
  })

  client.on('ready', () => {
    redisReady = true
    console.log('✅ Redis connected — using Redis for sessions')
  })

  client.on('error', () => {
    if (redisReady) {
      redisReady = false
      console.warn('⚠️  Redis disconnected — falling back to in-memory sessions')
    }
  })

  client.connect().catch(() => {
    console.warn('⚠️  Redis unavailable — using in-memory sessions (fine for local dev)')
  })

  return client
}

redis = initRedis()

function sessionKey(phone: string) {
  return `session:${phone}`
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function getSession(phone: string): Promise<Session> {
  if (redisReady && redis) {
    try {
      const raw = await redis.get(sessionKey(phone))
      return raw ? JSON.parse(raw) : emptySession()
    } catch {
      // fall through to memory
    }
  }
  return memoryStore.get(phone) ?? emptySession()
}

export async function saveSession(phone: string, session: Session) {
  if (redisReady && redis) {
    try {
      await redis.set(sessionKey(phone), JSON.stringify(session), 'EX', SESSION_TTL)
      return
    } catch {
      // fall through to memory
    }
  }
  memoryStore.set(phone, session)
}

export async function clearSession(phone: string) {
  if (redisReady && redis) {
    try {
      await redis.del(sessionKey(phone))
      return
    } catch {
      // fall through to memory
    }
  }
  memoryStore.delete(phone)
}
