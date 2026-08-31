import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isValidTokenFormat } from '@/lib/tokens'
import { firstOf } from '@/lib/embed'
import InvitationContent from '@/components/guest/InvitationContent'
import CinematicInvitation from '@/components/guest/CinematicInvitation'
import { cookies } from 'next/headers'
import WeddingDayTabs from '@/components/guest/WeddingDayTabs'

export const dynamic = 'force-dynamic'

interface InvitationPageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { token } = await params

  if (!isValidTokenFormat(token)) {
    notFound()
  }

  const supabase = createSupabaseServerClient()

  const [invitationResult, scheduleResult, weddingDayModeResult, playlistResult] = await Promise.all([
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
            rsvps (
              attendance,
              plus_one_name,
              plus_one_dietary_notes,
              dietary_notes,
              transport_required,
              accommodation_notes,
              notes
            )
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
    supabase
      .from('feature_flags')
      .select('value')
      .eq('key', 'wedding_day_mode')
      .single(),
    supabase
      .from('music_playlist')
      .select('title, artist, spotify_url, youtube_url, deezer_url, album_art_url, moment_category')
      .order('moment_category', { ascending: true })
      .order('priority', { ascending: true }),
  ])

  const { data: invitation } = invitationResult

  if (!invitation) {
    notFound()
  }

  const weddingDayMode = weddingDayModeResult.data?.value ?? false

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

  const playlist = (playlistResult.data || []).map((item: any) => ({
    title: item.title,
    artist: item.artist,
    spotify_url: item.spotify_url,
    youtube_url: item.youtube_url,
    deezer_url: item.deezer_url,
    album_art_url: item.album_art_url,
    moment_category: item.moment_category,
  }))

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
    const rsvp = firstOf<{
      attendance: string | null
      plus_one_name: string | null
      plus_one_dietary_notes: string | null
      dietary_notes: string | null
      transport_required: boolean | null
      accommodation_notes: string | null
      notes: string | null
    }>(ig.guests.rsvps)
    return {
      id: ig.guests.id,
      name: ig.guests.display_name || `${ig.guests.first_name} ${ig.guests.last_name}`,
      firstName: ig.guests.first_name,
      lastName: ig.guests.last_name,
      hasRsvp: !!rsvp,
      attendance: rsvp?.attendance || null,
      rsvp: rsvp
        ? {
            attendance: rsvp.attendance || '',
            plusOneName: rsvp.plus_one_name,
            plusOneDietaryNotes: rsvp.plus_one_dietary_notes,
            dietaryNotes: rsvp.dietary_notes,
            transportRequired: rsvp.transport_required,
            accommodationNotes: rsvp.accommodation_notes,
            notes: rsvp.notes,
          }
        : null,
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

  const cookieStore = await cookies()
  const styleParam = (await searchParams)?.style
  const cookieStyle = cookieStore.get('invitation-style')?.value
  const useCinematic = styleParam === 'cinematic' || cookieStyle === 'cinematic'

  const invitationProps = {
    greeting,
    guests,
    weddingDate: '2027-05-01' as const,
    token,
    schedule,
    seating,
  }

  if (weddingDayMode) {
    return (
      <>
        <InvitationToggle token={token} />
        <WeddingDayTabs
          {...invitationProps}
          playlist={playlist}
        />
      </>
    )
  }

  return (
    <>
      <InvitationToggle token={token} />
      {useCinematic ? (
        <CinematicInvitation {...invitationProps} />
      ) : (
        <InvitationContent {...invitationProps} />
      )}
    </>
  )
}

function InvitationToggle({ token }: { token: string }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-cream-dark bg-white/90 px-3 py-1.5 text-xs shadow-md backdrop-blur-sm">
      <span className="text-warm-gray">Estilo:</span>
      <a
        href={`/i/${token}`}
        className="rounded-full bg-charcoal px-2 py-0.5 text-white no-underline transition-colors hover:bg-warm-gray"
      >
        Clásica
      </a>
      <a
        href={`/i/${token}?style=cinematic`}
        className="rounded-full bg-sage px-2 py-0.5 text-white no-underline transition-colors hover:bg-sage-dark"
      >
        Cinemática
      </a>
    </div>
  )
}
