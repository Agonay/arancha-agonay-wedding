import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isValidTokenFormat } from '@/lib/tokens'
import { firstOf } from '@/lib/embed'
import RsvpForm from '@/components/guest/rsvp/RsvpForm'
import { RSVP_DEADLINE, isRsvpOpen } from '@/lib/config'

export const dynamic = 'force-dynamic'

interface RsvpPageProps {
  params: Promise<{ token: string }>
}

export default async function RsvpPage({ params }: RsvpPageProps) {
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
          plus_one_allowed,
          rsvps (
            attendance,
            plus_one_name,
            plus_one_dietary_notes,
            dietary_notes,
            dietary_requirements,
            transport_required,
            accommodation_notes,
            notes
          )
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
        plus_one_allowed: boolean
        rsvps: unknown
      }
    }[]
  }

  const guests = typedInv.invitation_guests.map((ig) => ({
    id: ig.guests.id,
    name: ig.guests.display_name || `${ig.guests.first_name} ${ig.guests.last_name}`,
    firstName: ig.guests.first_name,
    plusOneAllowed: ig.guests.plus_one_allowed,
    existingRsvp: firstOf<{
      attendance: string | null
      plus_one_name: string | null
      plus_one_dietary_notes: string | null
      dietary_notes: string | null
      dietary_requirements: unknown
      transport_required: boolean | null
      accommodation_notes: string | null
      notes: string | null
    }>(ig.guests.rsvps),
  }))

  const rsvpOpen = isRsvpOpen() || guests.some((g) => g.existingRsvp)

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">
            Confirmar asistencia
          </h1>
          <p className="text-warm-gray text-sm">
            Fecha límite: {RSVP_DEADLINE.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Form */}
        <RsvpForm guests={guests} rsvpOpen={rsvpOpen} />

        {/* Back link */}
        <div className="mt-8 text-center">
          <a
            href={`/i/${token}`}
            className="text-sm text-warm-gray-light hover:text-warm-gray transition-colors underline"
          >
            ← Volver a la invitación
          </a>
        </div>
      </div>
    </div>
  )
}
