type Level = 'info' | 'warn' | 'error'

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      error_name: err.name,
      error_message: err.message,
      error_stack: err.stack,
    }
  }
  return { error: String(err) }
}

function log(level: Level, message: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  const line = JSON.stringify(entry)

  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info:  (message: string, context?: Record<string, unknown>) => log('info',  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => log('warn',  message, context),
  error: (message: string, err?: unknown, context?: Record<string, unknown>) =>
    log('error', message, { ...serializeError(err), ...context }),
}
