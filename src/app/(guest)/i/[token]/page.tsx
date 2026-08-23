import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isValidTokenFormat } from '@/lib/tokens'
import InvitationContent from '@/components/guest/InvitationContent'

export const dynamic = 'force-dynamic'

interface InvitationPageProps {
  params: Promise<{ token: string }>
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params

  if (!isValidTokenFormat(token)) {
    notFound()
  }

  const supabase = createSupabaseServerClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select(`
      *,
      invitation_guests (
        is_primary,
        guests (
          id,
          first_name,
          last_name,
          display_name,
          rsvps ( attendance )
        )
      )
    `)
    .eq('token', token)
    .single()

  if (!invitation) {
    notFound()
  }

  const typedInv = invitation as {
    invitation_guests: {
      is_primary: boolean
      guests: {
        id: string
        first_name: string
        last_name: string
        display_name: string | null
        rsvps: { attendance: string | null }[] | null
      }
    }[]
  }

  const guests = typedInv.invitation_guests.map((ig) => ({
    id: ig.guests.id,
    name: ig.guests.display_name || `${ig.guests.first_name} ${ig.guests.last_name}`,
    firstName: ig.guests.first_name,
    lastName: ig.guests.last_name,
    hasRsvp: !!ig.guests.rsvps?.length,
    attendance: ig.guests.rsvps?.[0]?.attendance || null,
  }))

  const guestNames = guests.map((g) => g.name)
  const greeting = guestNames.length <= 2 ? guestNames.join(' & ') : guestNames[0]

  return (
    <InvitationContent
      greeting={greeting}
      guests={guests}
      weddingDate="2027-05-01"
      token={token}
    />
  )
}
