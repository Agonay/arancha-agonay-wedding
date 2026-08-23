import { createSupabaseSSRClient } from '@/lib/supabase/middleware'
import StatCard from '@/components/admin/StatCard'
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createSupabaseSSRClient()

  const { count: totalGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('attendance')
    .returns<{ attendance: string | null }[]>()

  const confirmed = rsvps?.filter((r: { attendance: string | null }) => r.attendance === 'attending').length || 0
  const pending = (totalGuests || 0) - confirmed
  const notAttending = rsvps?.filter((r: { attendance: string | null }) => r.attendance === 'not_attending').length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-warm-gray mt-1">Resumen de la boda</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Invitados"
          value={totalGuests || 0}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Confirmados"
          value={confirmed}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Pendientes"
          value={pending}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="No asisten"
          value={notAttending}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-medium text-charcoal mb-4">
          Estado actual
        </h2>
        <p className="text-warm-gray text-sm">
          Las funcionalidades de gestión de invitados, invitaciones, mesas y más
          estarán disponibles próximamente.
        </p>
      </div>
    </div>
  )
}
