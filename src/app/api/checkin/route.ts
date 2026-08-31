import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('id')
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ success: false, error: 'Invitación no encontrada' }, { status: 404 })
    }

    const { data: invitationGuests, error: igError } = await supabase
      .from('invitation_guests')
      .select('guests(id)')
      .eq('invitation_id', invitation.id)

    if (igError || !invitationGuests || invitationGuests.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron invitados' }, { status: 404 })
    }

    const guestIds = invitationGuests
      .map((ig: { guests: { id: string } | { id: string }[] }) => {
        const guest = Array.isArray(ig.guests) ? ig.guests[0] : ig.guests
        return guest?.id
      })
      .filter((id: string | undefined): id is string => !!id)

    const { error: updateError } = await supabase
      .from('guests')
      .update({ checked_in_at: new Date().toISOString() })
      .in('id', guestIds)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Error al confirmar llegada' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
