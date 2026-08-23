'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getWeddingId() {
  const supabase = createSupabaseServerClient()
  const { data: wedding, error } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (error || !wedding) throw new Error('No wedding record found.')
  return wedding.id as string
}

function revalidateLogistics() {
  revalidatePath('/admin/logistics')
  revalidatePath('/admin/transport')
  revalidatePath('/admin/dashboard')
}

// ---------- Venues ----------

export async function getVenues() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export type VenueInput = {
  name: string
  kind?: string
  address?: string | null
  maps_url?: string | null
  notes?: string | null
  sort_order?: number
}

export async function createVenue(data: VenueInput) {
  const supabase = createSupabaseServerClient()
  const wedding_id = await getWeddingId()

  const { data: venue, error } = await supabase
    .from('venues')
    .insert({ ...data, wedding_id })
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return venue
}

export async function updateVenue(id: string, data: Partial<VenueInput>) {
  const supabase = createSupabaseServerClient()
  const { data: venue, error } = await supabase
    .from('venues')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return venue
}

export async function deleteVenue(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('venues').delete().eq('id', id)
  if (error) throw error
  revalidateLogistics()
}

// ---------- Schedule events ----------

export async function getScheduleEvents() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*, venues ( id, name )')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export type ScheduleEventInput = {
  title: string
  description?: string | null
  event_date: string
  start_time: string
  end_time?: string | null
  venue_id?: string | null
  icon?: string | null
  is_public?: boolean
  sort_order?: number
}

export async function createScheduleEvent(data: ScheduleEventInput) {
  const supabase = createSupabaseServerClient()
  const wedding_id = await getWeddingId()

  const { data: event, error } = await supabase
    .from('schedule_events')
    .insert({ ...data, wedding_id })
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return event
}

export async function updateScheduleEvent(id: string, data: Partial<ScheduleEventInput>) {
  const supabase = createSupabaseServerClient()
  const { data: event, error } = await supabase
    .from('schedule_events')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return event
}

export async function deleteScheduleEvent(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('schedule_events').delete().eq('id', id)
  if (error) throw error
  revalidateLogistics()
}

// ---------- Transport options ----------

export async function getTransportOptions() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('transport_options')
    .select(`
      *,
      rsvps (
        guest_id,
        attendance,
        guests (
          first_name,
          last_name,
          display_name,
          phone,
          guest_groups ( name )
        )
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export type TransportOptionInput = {
  name: string
  direction?: string
  origin?: string | null
  destination?: string | null
  departure_time?: string | null
  return_time?: string | null
  capacity?: number | null
  notes?: string | null
  sort_order?: number
}

export async function createTransportOption(data: TransportOptionInput) {
  const supabase = createSupabaseServerClient()
  const wedding_id = await getWeddingId()

  const { data: option, error } = await supabase
    .from('transport_options')
    .insert({ ...data, wedding_id })
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return option
}

export async function updateTransportOption(id: string, data: Partial<TransportOptionInput>) {
  const supabase = createSupabaseServerClient()
  const { data: option, error } = await supabase
    .from('transport_options')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return option
}

export async function deleteTransportOption(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('transport_options').delete().eq('id', id)
  if (error) throw error
  revalidateLogistics()
}

// ---------- Accommodations ----------

export async function getAccommodations() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('accommodations')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export type AccommodationInput = {
  hotel_name: string
  address?: string | null
  booking_code?: string | null
  phone?: string | null
  price_note?: string | null
  check_in?: string | null
  check_out?: string | null
  notes?: string | null
  sort_order?: number
}

export async function createAccommodation(data: AccommodationInput) {
  const supabase = createSupabaseServerClient()
  const wedding_id = await getWeddingId()

  const { data: accommodation, error } = await supabase
    .from('accommodations')
    .insert({ ...data, wedding_id })
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return accommodation
}

export async function updateAccommodation(id: string, data: Partial<AccommodationInput>) {
  const supabase = createSupabaseServerClient()
  const { data: accommodation, error } = await supabase
    .from('accommodations')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateLogistics()
  return accommodation
}

export async function deleteAccommodation(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('accommodations').delete().eq('id', id)
  if (error) throw error
  revalidateLogistics()
}

// ---------- Transport assignment (RSVPs) ----------

export async function assignTransport(guestId: string, transportOptionId: string | null) {
  const supabase = createSupabaseServerClient()

  const existing = await supabase
    .from('rsvps')
    .select('id')
    .eq('guest_id', guestId)
    .single()

  if (existing.data) {
    const { error } = await supabase
      .from('rsvps')
      .update({ transport_option_id: transportOptionId })
      .eq('guest_id', guestId)
    if (error) throw error
  }

  revalidateLogistics()
}
