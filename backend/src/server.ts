import app from './app'
import { env } from './config/env'
import { initDB } from './services/db.service'
import { startReminderCron } from './cron/reminder-cron'

async function start() {
  await initDB()
  app.listen(env.port, () => {
    console.log(`API running on port ${env.port}`)
  })
  startReminderCron()
}

start()