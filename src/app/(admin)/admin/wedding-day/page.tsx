import { createSupabaseServerClient } from '@/lib/supabase/server'
import StatCard from '@/components/admin/StatCard'
import WeddingDayToggle from '@/components/admin/WeddingDayToggle'
import AttendanceList from '@/components/admin/wedding-day/AttendanceList'
import IncidentBoard from '@/components/admin/wedding-day/IncidentBoard'
import { CheckCircle2, Users, AlarmClock, AlertTriangle, DoorOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface GuestRow {
  id: string
  first_name: string
  last_name: string
  display_name: string | null
  checked_in_at: string | null
  rsvps: { attendance: string | null } | { attendance: string | null }[] | null
}

interface IncidentRow {
  id: string
  title: string
  severity: string
  description: string | null
  resolved_at: string | null
  created_at: string
}

function attendanceOf(rsvps: GuestRow['rsvps']): string | null {
  if (!rsvps) return null
  if (Array.isArray(rsvps)) return rsvps[0]?.attendance ?? null
  return rsvps.attendance ?? null
}

async function getWeddingId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: wedding } = await supabase.from('weddings').select('id').single()
  return wedding?.id
}

export default async function WeddingDayPage() {
  const supabase = createSupabaseServerClient()

  const weddingId = await getWeddingId(supabase)

  const [{ data: guests }, { data: incidents }, { data: flags }] = await Promise.all([
    supabase
      .from('guests')
      .select('id, first_name, last_name, display_name, checked_in_at, rsvps(attendance)')
      .eq('wedding_id', weddingId),
    supabase
      .from('incidents')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false }),
    supabase
      .from('feature_flags')
      .select('key, value')
      .eq('key', 'wedding_day_mode')
      .single(),
  ])

  const guestsList = (guests as GuestRow[] | null) || []
  const totalGuests = guestsList.length
  const checkedInCount = guestsList.filter((g) => g.checked_in_at).length
  const attendingCount = guestsList.filter((g) => attendanceOf(g.rsvps) === 'attending').length
  const pendingArrival = Math.max(0, attendingCount - checkedInCount)
  const incidentsList = (incidents as IncidentRow[] | null) || []
  const activeIncidents = incidentsList.filter((i) => !i.resolved_at).length

  const weddingDayMode = flags?.value ?? false

  const attendanceData = guestsList.map((g) => ({
    id: g.id,
    firstName: g.first_name,
    lastName: g.last_name,
    displayName: g.display_name,
    checkedInAt: g.checked_in_at,
    attendance: attendanceOf(g.rsvps),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Día de la boda</h1>
        <p className="text-gray-500 mt-1">
          Operaciones en tiempo real para el 1 de mayo de 2027
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Invitados" value={totalGuests} icon={Users} color="bg-gray-50 text-gray-600" />
        <StatCard title="Confirmados" value={attendingCount} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Llegados" value={checkedInCount} icon={DoorOpen} color="bg-blue-50 text-blue-600" />
        <StatCard title="Pend. de llegar" value={pendingArrival} icon={AlarmClock} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <AttendanceList initial={attendanceData} />
        <IncidentBoard initial={incidentsList} />
      </div>

      <WeddingDayToggle initialValue={weddingDayMode} />

      {activeIncidents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            Hay {activeIncidents} incidencia{activeIncidents !== 1 ? 's' : ''} activa{activeIncidents !== 1 ? 's' : ''}. Revísalas en el panel de incidencias.
          </p>
        </div>
      )}
    </div>
  )
}
