'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface GuestRow {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  checked_in_at: string | null
  rsvps: { attendance: string | null } | { attendance: string | null }[] | null
}

interface IncidentRow {
  id: string
  title: string
  severity: string
  description: string | null
  resolved_at: string | null
  created_at: string
}

interface InvitationGuestRow {
  invitations: { token: string } | { token: string }[] | null
}

interface GuestSearchRow {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  invitation_guests: InvitationGuestRow[] | null
}

function attendanceOf(rsvps: GuestRow['rsvps']): string | null {
  if (!rsvps) return null
  if (Array.isArray(rsvps)) return rsvps[0]?.attendance ?? null
  return rsvps.attendance ?? null
}

async function getWeddingId() {
  const supabase = createSupabaseServerClient()
  const { data: wedding, error } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (error || !wedding) throw new Error('No wedding record found.')
  return wedding.id
}

// ============================================
// Check-in
// ============================================

export type GuestSearchResult = {
  id: string
  name: string
  token: string
}

export async function searchGuestByName(query: string): Promise<GuestSearchResult[]> {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  let q = supabase
    .from('guests')
    .select('id, first_name, last_name, display_name, invitation_guests(invitations(token))')
    .eq('wedding_id', weddingId)

  terms.forEach((term) => {
    q = q.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
  })

  const { data, error } = await q.limit(20)

  if (error) throw error

  const results: GuestSearchResult[] = []
  const seen = new Set<string>()

  ;(data as GuestSearchRow[] | null | undefined)?.forEach((g) => {
    const tokens = g.invitation_guests
      ?.map((ig) => {
        const inv = ig.invitations
        if (Array.isArray(inv)) return inv[0]?.token
        return inv?.token
      })
      .filter((t: string | undefined): t is string => !!t)

    const token = tokens?.[0]
    if (token && !seen.has(g.id)) {
      seen.add(g.id)
      results.push({
        id: g.id,
        name: g.display_name || `${g.first_name} ${g.last_name}`,
        token,
      })
    }
  })

  return results
}

export async function getAttendance() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: guests, error } = await supabase
    .from('guests')
    .select('id, first_name, last_name, display_name, checked_in_at, rsvps(attendance)')
    .eq('wedding_id', weddingId)
    .order('checked_in_at', { ascending: false })

  if (error) throw error

  return (guests as GuestRow[] | null || []).map((g) => ({
    id: g.id,
    firstName: g.first_name,
    lastName: g.last_name,
    displayName: g.display_name,
    checkedInAt: g.checked_in_at,
    attendance: attendanceOf(g.rsvps),
  }))
}

export async function undoCheckIn(guestId: string) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('guests')
    .update({ checked_in_at: null })
    .eq('id', guestId)

  if (error) throw error

  revalidatePath('/admin/wedding-day')
  revalidatePath('/admin/dashboard')
}

// ============================================
// Incidents
// ============================================

export type IncidentInput = {
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string | null
}

export async function createIncident(data: IncidentInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({
      wedding_id: weddingId,
      title: data.title.trim(),
      severity: data.severity,
      description: data.description?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/wedding-day')
  revalidatePath('/admin/dashboard')

  return incident
}

export async function resolveIncident(id: string) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('incidents')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/wedding-day')
}

export async function deleteIncident(id: string) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/wedding-day')
}

export async function getIncidents() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as IncidentRow[] | null) || []
}

export async function getActiveIncidents() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('wedding_id', weddingId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as IncidentRow[] | null) || []
}

// ============================================
// Stats
// ============================================

export async function getWeddingDayStats() {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: guests, error } = await supabase
    .from('guests')
    .select('id, checked_in_at, rsvps(attendance)')
    .eq('wedding_id', weddingId)

  if (error) throw error

  const allGuests = (guests as GuestRow[] | null) || []
  const totalGuests = allGuests.length
  const checkedInCount = allGuests.filter((g) => g.checked_in_at).length
  const attendingCount = allGuests.filter((g) => attendanceOf(g.rsvps) === 'attending').length
  const notArrived = attendingCount - checkedInCount

  return {
    totalGuests,
    attendingCount,
    checkedInCount,
    notArrived: Math.max(0, notArrived),
  }
}
