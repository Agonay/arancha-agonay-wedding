// PostgREST returns to-one relationships (FK columns with UNIQUE constraints,
// e.g. rsvps.guest_id, guests.table_id) as single objects rather than arrays.
// supabase-js types them as arrays regardless — normalize at the boundary.
export function firstOf<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null
  return (value as T) ?? null
}
