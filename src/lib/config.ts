export const RSVP_DEADLINE = new Date('2027-04-01T23:59:59')

export function isRsvpOpen(): boolean {
  return new Date() < RSVP_DEADLINE
}
