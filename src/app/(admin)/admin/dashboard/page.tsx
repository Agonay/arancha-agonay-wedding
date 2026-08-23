import { createSupabaseServerClient } from '@/lib/supabase/server'
import StatCard from '@/components/admin/StatCard'
import { Users, CheckCircle, Clock, XCircle, Mail, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  // Ensure wedding exists
  const { data: wedding } = await supabase.from('weddings').select('id').single()
  if (!wedding) {
    await supabase.from('weddings').insert({
      couple_names: 'Arancha & Agonay',
      wedding_date: '2027-05-01',
      lifecycle_state: 'planning',
    })
  }

  const { count: totalGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })

  const { count: totalInvitations } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('attendance')
    .returns<{ attendance: string | null }[]>()

  const confirmed = rsvps?.filter((r: { attendance: string | null }) => r.attendance === 'attending').length || 0
  const notAttending = rsvps?.filter((r: { attendance: string | null }) => r.attendance === 'not_attending').length || 0
  const pending = (totalGuests || 0) - confirmed - notAttending

  const { data: uninvitedGuests } = await supabase
    .from('guests')
    .select('id')
    .is('invitation_guests', null)
    .limit(1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen de la boda</p>
      </div>

      {totalGuests === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Bienvenido</p>
            <p className="text-sm text-amber-700 mt-1">
              Empieza añadiendo invitados y creando invitaciones con código QR.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Invitados"
          value={totalGuests || 0}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Invitaciones"
          value={totalInvitations || 0}
          icon={Mail}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Confirmados"
          value={confirmed}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pendientes"
          value={pending}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Estado actual</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-2">RSVP</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Asistirán</span>
                <span className="font-medium text-emerald-600">{confirmed}</span>
              </div>
              <div className="flex justify-between">
                <span>No asistirán</span>
                <span className="font-medium text-red-600">{notAttending}</span>
              </div>
              <div className="flex justify-between">
                <span>Sin respuesta</span>
                <span className="font-medium text-amber-600">{pending}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-gray-500 mb-2">Invitaciones</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Invitados sin invitación</span>
                <span className="font-medium text-gray-900">{totalGuests ? totalGuests - (uninvitedGuests ? 0 : 0) : 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
