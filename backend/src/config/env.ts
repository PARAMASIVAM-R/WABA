import dotenv from 'dotenv'
dotenv.config()

export const env = {
  port: Number(process.env.PORT || 3000),
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!
}

if (!env.verifyToken || !env.accessToken || !env.phoneNumberId) {
  throw new Error('Missing WhatsApp environment variables')
}