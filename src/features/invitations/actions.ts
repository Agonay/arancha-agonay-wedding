'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { generateInvitationToken } from '@/lib/tokens'
import { revalidatePath } from 'next/cache'

export async function getInvitations() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      invitation_guests (
        guests ( id, first_name, last_name, display_name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getInvitation(id: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      invitation_guests (
        guests ( id, first_name, last_name, display_name )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getWeddingId() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('weddings')
    .select('id')
    .single()

  if (error) throw new Error('No wedding record found')
  return data.id
}

export async function createInvitation(guestIds: string[]) {
  const supabase = createSupabaseServerClient()
  const weddingId = await getWeddingId()

  const token = generateInvitationToken()

  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .insert({ wedding_id: weddingId, token, status: 'pending' })
    .select()
    .single()

  if (invError) throw invError

  if (guestIds.length > 0) {
    const rows = guestIds.map((guestId, i) => ({
      invitation_id: invitation.id,
      guest_id: guestId,
      is_primary: i === 0,
    }))

    const { error: linkError } = await supabase
      .from('invitation_guests')
      .insert(rows)

    if (linkError) throw linkError
  }

  revalidatePath('/admin/invitations')
  return { ...invitation, token }
}

export async function regenerateToken(invitationId: string) {
  const supabase = createSupabaseServerClient()
  const newToken = generateInvitationToken()

  const { data, error } = await supabase
    .from('invitations')
    .update({ token: newToken, updated_at: new Date().toISOString() })
    .eq('id', invitationId)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/invitations')
  return data
}

export async function toggleDelivered(invitationId: string, delivered: boolean) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('invitations')
    .update(
      delivered
        ? { status: 'delivered', delivered_at: new Date().toISOString() }
        : { status: 'pending', delivered_at: null }
    )
    .eq('id', invitationId)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/invitations')
  return data
}

export async function deleteInvitation(invitationId: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) throw error
  revalidatePath('/admin/invitations')
}

export async function ensureWedding() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.from('weddings').select('id').single()

  if (!data) {
    const { data: wedding, error } = await supabase
      .from('weddings')
      .insert({
        couple_names: 'Aránzazu & Agonay',
        wedding_date: '2027-05-01',
        lifecycle_state: 'planning',
      })
      .select()
      .single()

    if (error) throw error
    return wedding.id
  }

  return data.id
}
