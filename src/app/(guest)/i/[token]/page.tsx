import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isValidTokenFormat } from '@/lib/tokens'
import { firstOf } from '@/lib/embed'
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

  const [invitationResult, scheduleResult] = await Promise.all([
    supabase
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
            tables ( name ),
            rsvps ( attendance )
          )
        )
      `)
      .eq('token', token)
      .single(),
    supabase
      .from('schedule_events')
      .select(`
        title,
        description,
        event_date,
        start_time,
        end_time,
        icon,
        is_public,
        venues (
          name,
          maps_url
        )
      `)
      .eq('is_public', true)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ])

  const { data: invitation } = invitationResult

  if (!invitation) {
    notFound()
  }

  // Only expose public events to guests (defense in depth)
  const schedule = (scheduleResult.data || [])
    .filter((event) => event.is_public)
    .map((event) => {
      const venue = event.venues as unknown as { name: string; maps_url: string | null } | null
      return {
        title: event.title,
        description: event.description,
        eventDate: event.event_date,
        startTime: event.start_time,
        endTime: event.end_time,
        icon: event.icon,
        venueName: venue?.name || null,
        mapsUrl: venue?.maps_url || null,
      }
    })

  // PostgREST to-one joins are objects (see src/lib/embed.ts)
  const typedInv = invitation as {
    invitation_guests: {
      is_primary: boolean
      guests: {
        id: string
        first_name: string
        last_name: string
        display_name: string | null
        tables: unknown
        rsvps: unknown
      }
    }[]
  }

  const guests = typedInv.invitation_guests.map((ig) => {
    const rsvp = firstOf<{ attendance: string | null }>(ig.guests.rsvps)
    return {
      id: ig.guests.id,
      name: ig.guests.display_name || `${ig.guests.first_name} ${ig.guests.last_name}`,
      firstName: ig.guests.first_name,
      lastName: ig.guests.last_name,
      hasRsvp: !!rsvp,
      attendance: rsvp?.attendance || null,
    }
  })

  // Seating info: only attending guests with an assigned table
  const seating = typedInv.invitation_guests
    .map((ig) => {
      const rsvp = firstOf<{ attendance: string | null }>(ig.guests.rsvps)
      const table = firstOf<{ name: string }>(ig.guests.tables)
      if (!rsvp || rsvp.attendance !== 'attending' || !table?.name) return null
      return {
        guestName:
          ig.guests.display_name || ig.guests.first_name,
        tableName: table.name,
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  const guestNames = guests.map((g) => g.name)
  const greeting = guestNames.length <= 2 ? guestNames.join(' & ') : guestNames[0]

  return (
    <InvitationContent
      greeting={greeting}
      guests={guests}
      weddingDate="2027-05-01"
      token={token}
      schedule={schedule}
      seating={seating}
    />
  )
}
