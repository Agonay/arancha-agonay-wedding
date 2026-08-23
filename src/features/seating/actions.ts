'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateSeating() {
  revalidatePath('/admin/tables')
  revalidatePath('/admin/guests')
  revalidatePath('/admin/dashboard')
}

export async function getTables() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('tables')
    .select(`
      *,
      guests (
        id,
        first_name,
        last_name,
        display_name,
        table_id,
        guest_groups ( name ),
        rsvps ( attendance, plus_one_name )
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export type TableInput = {
  name: string
  capacity?: number
  notes?: string | null
  sort_order?: number
}

export async function createTable(data: TableInput) {
  const supabase = createSupabaseServerClient()

  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .select('id')
    .single()
  if (weddingError || !wedding) throw new Error('No wedding record found.')

  const { data: table, error } = await supabase
    .from('tables')
    .insert({ ...data, wedding_id: wedding.id })
    .select()
    .single()

  if (error) throw error
  revalidateSeating()
  return table
}

export async function updateTable(id: string, data: Partial<TableInput>) {
  const supabase = createSupabaseServerClient()
  const { data: table, error } = await supabase
    .from('tables')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidateSeating()
  return table
}

export async function deleteTable(id: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('tables').delete().eq('id', id)
  if (error) throw error
  revalidateSeating()
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('guests')
    .update({ table_id: tableId })
    .eq('id', guestId)

  if (error) throw error
  revalidateSeating()
}
