import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isRsvpOpen, RSVP_DEADLINE } from '@/lib/config'
import StatCard from '@/components/admin/StatCard'
import { CheckCircle, XCircle, Clock, Bus, AlertTriangle, CheckCheck } from 'lucide-react'
import { markRsvpsReviewed } from '@/features/rsvp/review-actions'
import RsvpRowActions from '@/components/admin/rsvps/RsvpRowActions'
import RsvpRowEditor from '@/components/admin/rsvps/RsvpRowEditor'

export const dynamic = 'force-dynamic'

export default async function RsvpsPage() {
  const supabase = createSupabaseServerClient()
  const rsvpOpen = isRsvpOpen()

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        display_name,
        plus_one_allowed,
        invitation_guests (
          invitations ( token )
        )
      )
    `)
    .order('submitted_at', { ascending: false })

  const { count: totalGuests } = await supabase.from('guests').select('*', { count: 'exact', head: true })

  const attending = rsvps?.filter((r: any) => r.attendance === 'attending') || []
  const notAttending = rsvps?.filter((r: any) => r.attendance === 'not_attending') || []
  const pending = (totalGuests || 0) - attending.length - notAttending.length
  const withTransport = attending.filter((r: any) => r.transport_required).length
  const withDietary = attending.filter((r: any) => r.dietary_notes).length
  const pendingReview = rsvps?.filter((r: any) => r.admin_notified === false).length || 0

  return (
    <form action={markRsvpsReviewed} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">RSVP</h1>
          <p className="text-gray-500 mt-1">
            {rsvpOpen
              ? `Plazo abierto hasta el ${new Date(RSVP_DEADLINE).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
              : 'Plazo de confirmación cerrado'}
          </p>
        </div>
        {pendingReview > 0 && (
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar como revisados ({pendingReview})
          </button>
        )}
      </div>

      {!rsvpOpen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            El plazo de confirmación ha finalizado. Los invitados ya no pueden modificar su respuesta.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Confirmados" value={attending.length} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="No asisten" value={notAttending.length} icon={XCircle} color="bg-red-50 text-red-600" />
        <StatCard title="Pendientes" value={pending} icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard title="Transporte" value={withTransport} icon={Bus} color="bg-blue-50 text-blue-600" />
      </div>

      {/* RSVP List */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">
            Respuestas ({rsvps?.length || 0})
            {pendingReview > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {pendingReview} sin revisar
              </span>
            )}
          </h2>
        </div>

        {rsvps?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aún no hay respuestas
          </div>
        ) : (
          <div className="divide-y">
            {rsvps?.map((rsvp: any) => {
              const guest = rsvp.guests
              const name = guest?.display_name || `${guest?.first_name} ${guest?.last_name}`
              const token = guest?.invitation_guests?.[0]?.invitations?.token
              return (
                <div key={rsvp.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {rsvp.admin_notified === false && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      )}
                      <span className={`inline-flex w-2 h-2 rounded-full ${
                        rsvp.attendance === 'attending' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        rsvp.attendance === 'attending' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {rsvp.attendance === 'attending' ? 'Asiste' : 'No asiste'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-400">
                      {rsvp.plus_one_name && <span>+1: {rsvp.plus_one_name}</span>}
                      {rsvp.plus_one_dietary_notes && <span className="text-amber-600">Alergia +1: {rsvp.plus_one_dietary_notes}</span>}
                      {rsvp.dietary_notes && <span className="text-amber-600">Alergia: {rsvp.dietary_notes}</span>}
                      {rsvp.transport_required && <span className="text-blue-600">Transporte</span>}
                    </div>
                    {rsvp.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">{rsvp.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs text-gray-400">
                    {token && (
                      <a href={`/i/${token}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
                        Ver invitación
                      </a>
                    )}
                    {rsvp.submitted_at && (
                      <span>{new Date(rsvp.submitted_at).toLocaleDateString('es-ES')}</span>
                    )}
                    {rsvp.admin_notified === false && (
                      <span className="text-blue-600 font-medium">Actualizado</span>
                    )}
                    <RsvpRowEditor guestId={rsvp.guest_id} rsvp={rsvp} plusOneAllowed={!!guest?.plus_one_allowed} />
                    <RsvpRowActions guestId={rsvp.guest_id} guestName={name} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </form>
  )
}
