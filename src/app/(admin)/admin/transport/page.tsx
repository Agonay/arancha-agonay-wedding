import { createSupabaseServerClient } from '@/lib/supabase/server'
import TransportManager from '@/components/admin/logistics/TransportManager'
import TransportAssignments from '@/components/admin/logistics/TransportAssignments'

export const dynamic = 'force-dynamic'

export default async function TransportPage() {
  const supabase = createSupabaseServerClient()

  const [optionsResult, rsvpsResult] = await Promise.all([
    supabase.from('transport_options').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('rsvps')
      .select(`
        guest_id,
        transport_option_id,
        transport_notes,
        plus_one_name,
        guests (
          first_name,
          last_name,
          display_name,
          phone,
          guest_groups ( name )
        )
      `)
      .eq('attendance', 'attending')
      .eq('transport_required', true),
  ])

  const options = optionsResult.data || []

  const guestsNeedingTransport = (rsvpsResult.data || [])
    .map((rsvp) => {
      const guest = rsvp.guests as unknown as {
        first_name: string
        last_name: string
        display_name: string | null
        phone: string | null
        guest_groups: { name: string } | null
      } | null
      if (!guest) return null
      return {
        guest_id: rsvp.guest_id as string,
        name: guest.display_name || `${guest.first_name} ${guest.last_name}`,
        group_name: guest.guest_groups?.name || null,
        phone: guest.phone || null,
        plus_one_name: rsvp.plus_one_name || null,
        transport_option_id: rsvp.transport_option_id as string | null,
        transport_notes: rsvp.transport_notes || null,
      }
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Transporte</h1>
        <p className="text-gray-500 mt-1">Autobuses y asignación de invitados</p>
      </div>

      <TransportManager options={options} />

      <TransportAssignments
        guests={guestsNeedingTransport}
        options={options.map((o) => ({ id: o.id, name: o.name }))}
      />
    </div>
  )
}
