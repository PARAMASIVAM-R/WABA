import dotenv from 'dotenv'
dotenv.config()

export const env = {
  port: Number(process.env.PORT || 3000),
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  dbHost: process.env.DB_HOST!,
  dbUser: process.env.DB_USER!,
  dbPassword: process.env.DB_PASSWORD!,
  dbName: process.env.DB_NAME!,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
}

if (!env.verifyToken || !env.accessToken || !env.phoneNumberId) {
  throw new Error('Missing WhatsApp environment variables')
}

if (!env.dbHost || !env.dbUser || !env.dbName) {
  throw new Error('Missing database environment variables')
}