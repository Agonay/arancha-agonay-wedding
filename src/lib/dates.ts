// Server-side date helpers (pages are force-dynamic).
export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Unique object key fragment for storage uploads. */
export function uniqueFileKey(safeName: string): string {
  return `${Date.now()}-${safeName}`
}
