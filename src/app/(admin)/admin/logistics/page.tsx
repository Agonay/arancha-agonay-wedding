import { createSupabaseServerClient } from '@/lib/supabase/server'
import VenueManager from '@/components/admin/logistics/VenueManager'
import ScheduleManager from '@/components/admin/logistics/ScheduleManager'
import AccommodationManager from '@/components/admin/logistics/AccommodationManager'

export const dynamic = 'force-dynamic'

export default async function LogisticsPage() {
  const supabase = createSupabaseServerClient()

  const [venuesResult, eventsResult, accommodationsResult] = await Promise.all([
    supabase.from('venues').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('schedule_events')
      .select('*, venues ( id, name )')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase.from('accommodations').select('*').order('sort_order', { ascending: true }),
  ])

  const venues = venuesResult.data || []
  const events = eventsResult.data || []
  const accommodations = accommodationsResult.data || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Logística</h1>
        <p className="text-gray-500 mt-1">Lugares, horario y alojamiento</p>
      </div>

      <VenueManager venues={venues} />

      <ScheduleManager
        events={events}
        venues={venues.map((v) => ({ id: v.id, name: v.name }))}
      />

      <AccommodationManager accommodations={accommodations} />
    </div>
  )
}
