import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isoToday, isoInDays } from '@/lib/dates'
import Link from 'next/link'
import StatCard from '@/components/admin/StatCard'
import { Users, CheckCircle, Clock, XCircle, Mail, AlertCircle, Bus, UtensilsCrossed } from 'lucide-react'
import { isRsvpOpen } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  // Ensure wedding exists
  const { data: wedding } = await supabase.from('weddings').select('id').single()
  if (!wedding) {
    await supabase.from('weddings').insert({
      couple_names: 'Aránzazu & Agonay',
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

  const { data: rsvps } = await supabase.from('rsvps').select('attendance, transport_required, dietary_notes, admin_notified')
  const rsvpOpen = isRsvpOpen()

  // Vendor payment alerts: overdue or due within 30 days
  const today = isoToday()
  const in30 = isoInDays(30)
  const { data: duePayments } = await supabase
    .from('vendor_payments')
    .select('id, concept, amount, due_date, vendors ( name )')
    .is('paid_at', null)
    .lte('due_date', in30)
    .order('due_date', { ascending: true })
    .limit(5)

  const paymentAlerts = (duePayments || []) as unknown as {
    id: string
    concept: string
    amount: number | null
    due_date: string
    vendors: { name: string } | { name: string }[] | null
  }[]
  const overdueAlerts = paymentAlerts.filter((p) => p.due_date < today)

  const confirmed = rsvps?.filter((r: any) => r.attendance === 'attending').length || 0
  const notAttending = rsvps?.filter((r: any) => r.attendance === 'not_attending').length || 0
  const pending = (totalGuests || 0) - confirmed - notAttending
  const withTransport = rsvps?.filter((r: any) => r.attendance === 'attending' && r.transport_required).length || 0
  const withDietary = rsvps?.filter((r: any) => r.attendance === 'attending' && r.dietary_notes).length || 0
  const pendingReview = rsvps?.filter((r: any) => r.admin_notified === false).length || 0

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

      {pendingReview > 0 && (
        <Link href="/admin/rsvps" className="block">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-blue-100 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-sm font-medium text-blue-800">
                  {pendingReview} RSVP{pendingReview > 1 ? 's' : ''} actualizado{pendingReview > 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {pendingReview > 1
                  ? 'Hay cambios pendientes de revisar. Haz clic para verlos.'
                  : 'Un invitado ha actualizado su respuesta.'}
              </p>
            </div>
            <span className="text-blue-600 text-sm">Ver →</span>
          </div>
        </Link>
      )}

      {!rsvpOpen && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            El plazo de RSVP ha finalizado. Los invitados ya no pueden modificar su respuesta.
          </p>
        </div>
      )}

      {paymentAlerts.length > 0 && (
        <Link href="/admin/vendors" className="block">
          <div className={`rounded-xl border p-4 cursor-pointer transition-colors ${overdueAlerts.length > 0 ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'}`}>
            <div className="flex items-center gap-2">
              {overdueAlerts.length > 0 && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              <p className={`text-sm font-medium ${overdueAlerts.length > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                Pagos a proveedores: {overdueAlerts.length > 0 ? `${overdueAlerts.length} vencido${overdueAlerts.length > 1 ? 's' : ''}` : 'próximos vencimientos'}
              </p>
            </div>
            <ul className="mt-2 space-y-1">
              {paymentAlerts.map((p) => {
                const vendor = Array.isArray(p.vendors) ? p.vendors[0] : p.vendors
                const overdue = p.due_date < today
                return (
                  <li key={p.id} className="text-sm flex justify-between gap-3">
                    <span className={overdue ? 'text-red-700' : 'text-amber-700'}>
                      <span className="font-medium">{vendor?.name}</span> · {p.concept}
                    </span>
                    <span className={`flex-shrink-0 ${overdue ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                      {p.amount !== null ? `${p.amount} € · ` : ''}{p.due_date.split('-').reverse().join('/')}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs mt-2 opacity-75">Ver todos en Proveedores →</p>
          </div>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Invitados" value={totalGuests || 0} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard title="Invitaciones" value={totalInvitations || 0} icon={Mail} color="bg-purple-50 text-purple-600" />
        <StatCard title="Confirmados" value={confirmed} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pendientes" value={pending} icon={Clock} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Estado actual</h2>
        <div className="grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-3 font-medium">RSVP</p>
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
              <div className="border-t pt-2 flex justify-between">
                <span>Tasa de respuesta</span>
                <span className="font-medium text-gray-900">
                  {totalGuests ? Math.round(((confirmed + notAttending) / totalGuests) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-gray-500 mb-3 font-medium">Logística (confirmados)</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-gray-400" />
                  Transporte
                </span>
                <span className="font-medium text-gray-900">{withTransport}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-gray-400" />
                  Menús especiales
                </span>
                <span className="font-medium text-gray-900">{withDietary}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
