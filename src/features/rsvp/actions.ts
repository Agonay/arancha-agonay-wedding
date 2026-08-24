'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGuestRsvp(guestId: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('guest_id', guestId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function submitRsvp(data: {
  guest_id: string
  attendance: string
  plus_one_name?: string
  plus_one_dietary_notes?: string
  dietary_requirements?: Record<string, unknown>
  dietary_notes?: string
  transport_required?: boolean
  accommodation_notes?: string
  notes?: string
}) {
  const supabase = createSupabaseServerClient()

  const [{ data: guestData }, existing] = await Promise.all([
    supabase.from('guests').select('plus_one_allowed').eq('id', data.guest_id).single(),
    getGuestRsvp(data.guest_id),
  ])

  const allowed = guestData?.plus_one_allowed ?? false

  const payload = {
    attendance: data.attendance,
    plus_one_name: allowed ? (data.plus_one_name || null) : null,
    plus_one_dietary_notes: allowed ? (data.plus_one_dietary_notes || null) : null,
    dietary_requirements: data.dietary_requirements || null,
    dietary_notes: data.dietary_notes || null,
    transport_required: data.transport_required || null,
    accommodation_notes: data.accommodation_notes || null,
    notes: data.notes || null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { data: rsvp, error } = await supabase
      .from('rsvps')
      .update(payload)
      .eq('guest_id', data.guest_id)
      .select()
      .single()

    if (error) throw error
    return rsvp
  } else {
    const { data: rsvp, error } = await supabase
      .from('rsvps')
      .insert({ ...payload, guest_id: data.guest_id })
      .select()
      .single()

    if (error) throw error
    return rsvp
  }
}

export async function getRsvpOverview() {
  const supabase = createSupabaseServerClient()

  const { data: rsvps, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        display_name,
        invitation_guests (
          invitations ( token )
        )
      )
    `)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return rsvps || []
}
