import { LRUCache } from 'lru-cache'
import { NextResponse } from 'next/server'

const cache = new LRUCache<string, number[]>({ max: 2000 })

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (cache.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= limit) {
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  timestamps.push(now)
  cache.set(key, timestamps)
  return { allowed: true, retryAfter: 0 }
}

export function getIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}
