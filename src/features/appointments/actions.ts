'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'realizada' | 'cancelada'

export type AppointmentInput = {
  title: string
  category: string
  vendor_id?: string | null
  appointment_date: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  status?: AppointmentStatus
  notes?: string | null
}

function revalidateCitas() {
  revalidatePath('/admin/citas')
  revalidatePath('/admin/dashboard')
}

async function getWeddingId() {
  const supabase = createSupabaseServerClient()
  const { data: wedding, error } = await supabase.from('weddings').select('id').single()
  if (error || !wedding) throw new Error('No wedding record found.')
  return wedding.id as string
}

type SanitizedAppointment = {
  title: string
  category: string
  vendor_id: string | null
  appointment_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  status: AppointmentStatus
  notes: string | null
  reminder_7d_sent_at?: string | null
  reminder_1d_sent_at?: string | null
}

function sanitizeAppointment(data: AppointmentInput): SanitizedAppointment {
  return {
    title: data.title.trim(),
    category: data.category.trim() || 'Otro',
    vendor_id: data.vendor_id || null,
    appointment_date: data.appointment_date,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    location: data.location?.trim() || null,
    status: data.status || 'pendiente',
    notes: data.notes?.trim() || null,
  }
}

export async function createAppointment(data: AppointmentInput) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({ ...sanitizeAppointment(data), wedding_id: weddingId })
    .select()
    .single()

  if (error) throw error
  revalidateCitas()
  return appointment
}

export async function updateAppointment(id: string, data: AppointmentInput) {
  const supabase = createSupabaseServerClient()

  // If the date moved after reminders were already sent, reset the flags so
  // the daily cron fires again for the new date.
  const { data: existing } = await supabase
    .from('appointments')
    .select('appointment_date')
    .eq('id', id)
    .single()

  const patch = sanitizeAppointment(data)
  if (existing && existing.appointment_date !== data.appointment_date) {
    patch.reminder_7d_sent_at = null
    patch.reminder_1d_sent_at = null
  }

  const { error } = await supabase.from('appointments').update(patch).eq('id', id)
  if (error) throw error
  revalidateCitas()
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
  if (error) throw error
  revalidateCitas()
}

export async function deleteAppointment(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
  revalidateCitas()
}
