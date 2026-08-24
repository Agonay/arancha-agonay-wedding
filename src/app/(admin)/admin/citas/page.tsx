import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isoToday, isoInDays } from '@/lib/dates'
import StatCard from '@/components/admin/StatCard'
import AppointmentsBoard, { type BoardAppointment } from '@/components/admin/appointments/AppointmentsBoard'
import { CalendarClock, CalendarCheck, Hourglass, CircleCheckBig } from 'lucide-react'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pendiente', 'confirmada', 'realizada', 'cancelada']

export default async function CitasPage() {
  const supabase = createSupabaseServerClient()

  const { data: rawCitas } = await supabase
    .from('appointments')
    .select(`
      id, title, category, vendor_id, appointment_date,
      start_time, end_time, location, status, notes,
      vendors ( name )
    `)
    .order('appointment_date', { ascending: true })

  const citas: BoardAppointment[] = (rawCitas || []).map((a: {
    id: string
    title: string
    category: string
    vendor_id: string | null
    appointment_date: string
    start_time: string | null
    end_time: string | null
    location: string | null
    status: string
    notes: string | null
    vendors: { name: string } | { name: string }[] | null
  }) => {
    const vendor = Array.isArray(a.vendors) ? a.vendors[0] : a.vendors
    return {
      id: a.id,
      title: a.title,
      category: a.category,
      vendorId: a.vendor_id,
      vendorName: vendor?.name ?? null,
      date: a.appointment_date,
      startTime: a.start_time,
      endTime: a.end_time,
      location: a.location,
      status: (VALID_STATUSES.includes(a.status) ? a.status : 'pendiente') as BoardAppointment['status'],
      notes: a.notes,
    }
  })

  const { data: rawVendors } = await supabase.from('vendors').select('id, name').order('name', { ascending: true })
  const vendorOptions = (rawVendors || []) as unknown as { id: string; name: string }[]

  // Stats
  const today = isoToday()
  const in7 = isoInDays(7)
  const active = citas.filter((c) => c.status === 'pendiente' || c.status === 'confirmada')
  const upcomingCount = active.filter((c) => c.date >= today).length
  const thisWeekCount = active.filter((c) => c.date >= today && c.date <= in7).length
  const pendingCount = citas.filter((c) => c.status === 'pendiente').length
  const doneCount = citas.filter((c) => c.status === 'realizada').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Citas</h1>
        <p className="text-gray-500 mt-1">Agenda de pruebas, catas y reuniones</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Próximas" value={upcomingCount} icon={CalendarClock} color="bg-sage-light/40 text-sage-dark" />
        <StatCard title="Esta semana" value={thisWeekCount} icon={CalendarCheck} color="bg-blue-50 text-blue-600" />
        <StatCard title="Pendientes de confirmar" value={pendingCount} icon={Hourglass} color="bg-amber-50 text-amber-600" />
        <StatCard title="Realizadas" value={doneCount} icon={CircleCheckBig} color="bg-emerald-50 text-emerald-600" />
      </div>

      <AppointmentsBoard citas={citas} vendors={vendorOptions} />
    </div>
  )
}
