export const RSVP_DEADLINE = new Date('2027-04-01T23:59:59')

export function isRsvpOpen(): boolean {
  return new Date() < RSVP_DEADLINE
}

export const WEDDING_DATE = process.env.WEDDING_DATE || '2027-05-01'

export function isWeddingDay(): boolean {
  const today = new Date().toISOString().split('T')[0]
  return today === WEDDING_DATE
}

export const GUEST_TOKEN_STORAGE_KEY = 'wedding_guest_token'
