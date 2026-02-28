export function extractMessage(payload: any) {
  try {
    const entry = payload.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const message = value?.messages?.[0]

    if (!message) return null

    // Handle interactive message responses
    if (message.type === 'interactive') {
      const interactive = message.interactive
      if (interactive.type === 'button_reply') {
        return {
          from: message.from,
          text: interactive.button_reply.title
        }
      }
      if (interactive.type === 'list_reply') {
        return {
          from: message.from,
          text: interactive.list_reply.title
        }
      }
    }

    // Handle text messages
    if (message.type === 'text') {
      return {
        from: message.from,
        text: message.text.body.trim()
      }
    }

    return null
  } catch {
    return null
  }
}