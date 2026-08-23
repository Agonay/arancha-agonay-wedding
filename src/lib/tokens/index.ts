import { randomBytes } from 'crypto'

export function generateInvitationToken(): string {
  return randomBytes(16).toString('base64url')
}

export function isValidTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,24}$/.test(token)
}
