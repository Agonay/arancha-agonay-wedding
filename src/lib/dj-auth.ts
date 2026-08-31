import { createHash } from 'crypto'
import { cookies } from 'next/headers'

export const DJ_AUTH_COOKIE = 'dj_auth'

export function djCookieValue(): string | null {
  const pw = process.env.DJ_PASSWORD
  if (!pw) return null
  return createHash('sha256').update(pw).digest('hex')
}

export async function isDjAuthenticated(): Promise<boolean> {
  const expected = djCookieValue()
  if (!expected) return false
  const store = await cookies()
  return store.get(DJ_AUTH_COOKIE)?.value === expected
}
