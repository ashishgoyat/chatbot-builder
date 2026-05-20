import { LRUCache } from 'lru-cache'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// ── In-memory fallback — used in local dev when Upstash env vars are absent ───
const memCache = new LRUCache<string, number[]>({ max: 2000 })

function memRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const timestamps = (memCache.get(key) ?? []).filter(t => t > now - windowMs)
  if (timestamps.length >= limit) {
    return { allowed: false, retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000) }
  }
  timestamps.push(now)
  memCache.set(key, timestamps)
  return { allowed: true, retryAfter: 0 }
}

// ── Upstash Redis — used in production (distributed, survives serverless cold starts) ──
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// Cache Ratelimit instances by (limit, windowMs) so we don't recreate them per request
const limiterCache = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(
      cacheKey,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
        prefix: '@rl',
      }),
    )
  }
  return limiterCache.get(cacheKey)!
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (redis) {
    const { success, reset } = await getLimiter(limit, windowMs).limit(key)
    return {
      allowed: success,
      retryAfter: success ? 0 : Math.ceil((reset - Date.now()) / 1000),
    }
  }
  return memRateLimit(key, limit, windowMs)
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
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}
