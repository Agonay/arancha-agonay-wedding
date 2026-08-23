'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markRsvpsReviewed() {
  const supabase = createSupabaseServerClient()
  await supabase
    .from('rsvps')
    .update({ admin_notified: true })
    .eq('admin_notified', false)

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/rsvps')
}
