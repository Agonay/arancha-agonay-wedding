'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGuests() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      guest_groups ( id, name, color ),
      invitation_guests (
        invitation_id,
        is_primary,
        invitations ( token, status, delivered_at )
      ),
      rsvps ( attendance, plus_one_name, dietary_notes, notes )
    `)
    .order('last_name', { ascending: true })

  if (error) throw error
  return data
}

export async function getGuest(id: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      guest_groups ( id, name, color ),
      invitation_guests (
        invitation_id,
        is_primary,
        invitations ( token, status, delivered_at )
      ),
      rsvps ( * )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createGuest(data: {
  first_name: string
  last_name: string
  display_name?: string
  group_id?: string
  phone?: string
  email?: string
  notes?: string
}) {
  const supabase = createSupabaseServerClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .single()

  if (!wedding) throw new Error('No wedding record found. Create one first.')

  const { data: guest, error } = await supabase
    .from('guests')
    .insert({ ...data, wedding_id: wedding.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/guests')
  return guest
}

export async function updateGuest(id: string, data: {
  first_name?: string
  last_name?: string
  display_name?: string
  group_id?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}) {
  const supabase = createSupabaseServerClient()
  const { data: guest, error } = await supabase
    .from('guests')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/guests')
  revalidatePath(`/admin/guests/${id}`)
  return guest
}

export async function deleteGuest(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/guests')
}

export async function updateGuestRsvp(guestId: string, data: {
  attendance?: string | null
  plus_one_name?: string | null
  dietary_notes?: string | null
  transport_required?: boolean | null
  transport_notes?: string | null
  accommodation_notes?: string | null
  notes?: string | null
  admin_notified?: boolean
}) {
  const supabase = createSupabaseServerClient()

  const existing = await supabase
    .from('rsvps')
    .select('id')
    .eq('guest_id', guestId)
    .single()

  if (existing.data) {
    const { error } = await supabase
      .from('rsvps')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('guest_id', guestId)

    if (error) throw error
  } else if (data.attendance) {
    const { error } = await supabase
      .from('rsvps')
      .insert({
        guest_id: guestId,
        ...data,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) throw error
  }

  revalidatePath('/admin/guests')
  revalidatePath('/admin/rsvps')
  revalidatePath('/admin/dashboard')
}
