'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGuestGroups() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('guest_groups')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createGroup(name: string, color?: string) {
  const supabase = createSupabaseServerClient()
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .single()

  if (!wedding) throw new Error('No wedding record found')

  const { data, error } = await supabase
    .from('guest_groups')
    .insert({ wedding_id: wedding.id, name, color })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/guests')
  return data
}
