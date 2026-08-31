import { Clock, Heart, Wine, UtensilsCrossed, Music, Bus, Camera, MapPin, Armchair, Check } from 'lucide-react'
import Countdown from './Countdown'

export interface GuestRsvpSummary {
  attendance: string
  plusOneName: string | null
  plusOneDietaryNotes: string | null
  dietaryNotes: string | null
  transportRequired: boolean | null
  accommodationNotes: string | null
  notes: string | null
}

interface Guest {
  id: string
  name: string
  firstName: string
  lastName: string
  hasRsvp: boolean
  attendance: string | null
  rsvp: GuestRsvpSummary | null
}

export interface ScheduleItem {
  title: string
  description: string | null
  eventDate: string
  startTime: string
  endTime: string | null
  icon: string | null
  venueName: string | null
  mapsUrl: string | null
}

export interface SeatingItem {
  guestName: string
  tableName: string
}

interface InvitationContentProps {
  greeting: string
  guests: Guest[]
  weddingDate: string
  token: string
  schedule?: ScheduleItem[]
  seating?: SeatingItem[]
}

const ICONS: Record<string, typeof Clock> = {
  heart: Heart,
  wine: Wine,
  dinner: UtensilsCrossed,
  party: Music,
  bus: Bus,
  camera: Camera,
}

function EventIcon({ iconKey }: { iconKey: string | null }) {
  const Icon = (iconKey && ICONS[iconKey]) || Clock
  return <Icon className="h-4 w-4 text-sage-dark" />
}

function RsvpBadge({ guest }: { guest: Guest }) {
  if (!guest.rsvp) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
        Pendiente
      </span>
    )
  }
  if (guest.rsvp.attendance === 'attending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex-shrink-0">
        <Check className="h-3 w-3" />
        Asiste
      </span>
    )
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full bg-cream-dark text-warm-gray text-xs font-medium flex-shrink-0">
      No asistirá
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <p className="text-xs leading-relaxed">
      <span className="text-warm-gray-light">{label}: </span>
      <span className="text-charcoal">{value}</span>
    </p>
  )
}

export default function InvitationContent({ greeting, guests, weddingDate, token, schedule = [], seating = [] }: InvitationContentProps) {
  const date = new Date(weddingDate)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const someRsvpd = guests.some((g) => g.hasRsvp)
  const allAnswered = guests.every((g) => g.hasRsvp)
  const allAttending = guests.every((g) => g.attendance === 'attending')

  let rsvpTitle = 'Confirmar asistencia'
  if (allAnswered && allAttending) {
    rsvpTitle = 'Confirmado'
  } else if (allAnswered) {
    rsvpTitle = 'Respuesta registrada'
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sage text-sm tracking-widest uppercase mb-6">
            ¡Nos casamos!
          </p>
          <h1 className="text-5xl md:text-6xl font-serif text-charcoal mb-6">
            Aránzazu <span className="text-sage">&</span> Agonay
          </h1>
          <div className="w-16 h-px bg-sage mx-auto" />
        </div>

        {/* Personalized greeting */}
        <div className="text-center mb-12">
          <p className="text-xl text-warm-gray font-serif italic mb-2">
            Hola {greeting}
          </p>
          <p className="text-warm-gray">
            Estamos muy felices de que forméis parte de nuestro día especial.
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm mb-8 text-center">
          <Countdown weddingDate={weddingDate} />
        </div>

        {/* Wedding info card */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm mb-8">
          <h2 className="text-lg font-serif text-charcoal mb-4 text-center">
            Detalles de la boda
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-warm-gray">Fecha</span>
              <span className="font-medium text-charcoal capitalize">
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-warm-gray">Invitados</span>
              <span className="font-medium text-charcoal">
                {guests.map((g) => g.name.split(' ')[0]).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* RSVP card */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm mb-8">
          <h2 className="text-lg font-serif text-charcoal mb-2 text-center">
            {rsvpTitle}
          </h2>
          {allAnswered ? (
            <p className={`text-sm mb-5 text-center ${allAttending ? 'text-emerald-600' : 'text-warm-gray'}`}>
              {allAttending
                ? '¡Gracias por confirmar! Nos vemos el 1 de mayo.'
                : 'Gracias por vuestra respuesta.'}
            </p>
          ) : (
            <p className="text-sm text-warm-gray mb-5 text-center">
              Por favor, confirmad vuestra asistencia antes del 1 de abril de 2027.
            </p>
          )}

          {someRsvpd && (
            <div className="space-y-3 mb-5">
              {guests.map((g) =>
                g.rsvp ? (
                  <div key={g.id} className="rounded-xl bg-cream p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-charcoal">{g.name}</span>
                      <RsvpBadge guest={g} />
                    </div>
                    {g.rsvp.attendance === 'attending' && (
                      <div className="space-y-0.5">
                        {g.rsvp.plusOneName && (
                          <>
                            <DetailRow label="Acompañante" value={g.rsvp.plusOneName} />
                            <DetailRow label="Alergias acompañante" value={g.rsvp.plusOneDietaryNotes} />
                          </>
                        )}
                        <DetailRow label="Alergias" value={g.rsvp.dietaryNotes} />
                        {g.rsvp.transportRequired !== null && (
                          <DetailRow
                            label="Transporte"
                            value={g.rsvp.transportRequired ? 'Sí' : 'No'}
                          />
                        )}
                        <DetailRow label="Alojamiento" value={g.rsvp.accommodationNotes} />
                        <DetailRow label="Notas" value={g.rsvp.notes} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    key={g.id}
                    className="rounded-xl border border-dashed border-cream-dark p-4 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-warm-gray">{g.name}</span>
                    <RsvpBadge guest={g} />
                  </div>
                )
              )}
            </div>
          )}

          <div className="text-center">
            <a
              href={`/i/${token}/rsvp`}
              className="inline-block px-6 py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-warm-gray transition-colors"
            >
              {someRsvpd ? 'Modificar respuesta' : 'Confirmar'}
            </a>
          </div>
        </div>

        {/* Seating assignment */}
        {seating.length > 0 && (
          <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm mb-8 text-center">
            <h2 className="text-lg font-serif text-charcoal mb-1">
              Tu mesa
            </h2>
            <p className="text-sm text-warm-gray-light mb-4">
              Te esperamos en:
            </p>
            <div className="space-y-3">
              {seating.map((s) => (
                <div key={s.guestName} className="flex items-center justify-center gap-3">
                  <Armchair className="h-5 w-5 text-sage flex-shrink-0" />
                  <span className="text-charcoal font-medium">{s.guestName}</span>
                  <span className="text-xs text-warm-gray-light">·</span>
                  <span className="inline-flex px-3 py-1 rounded-full bg-sage-light/40 text-sage-dark text-sm font-medium">
                    {s.tableName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wedding day schedule */}
        {schedule.length > 0 ? (
          <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm mb-8">
            <h2 className="text-lg font-serif text-charcoal mb-1 text-center">
              El gran día
            </h2>
            <p className="text-sm text-warm-gray-light text-center mb-6">
              Así viviremos el 1 de mayo
            </p>
            <div className="relative">
              {schedule.map((item, index) => {
                const prevItem = index > 0 ? schedule[index - 1] : null
                const showDateHeader = !prevItem || prevItem.eventDate !== item.eventDate
                const formattedTime = `${item.startTime.slice(0, 5)}${item.endTime ? ` – ${item.endTime.slice(0, 5)}` : ''}`
                return (
                  <div key={`${item.eventDate}-${item.startTime}-${item.title}`}>
                    {showDateHeader && (
                      <p className="text-xs font-medium text-sage-dark uppercase tracking-wide capitalize mb-3 mt-1 first:mt-0">
                        {new Date(`${item.eventDate}T12:00:00`).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    )}
                    <div className="flex gap-4 pb-6 last:pb-0 relative">
                      {index < schedule.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-sage-light" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-sage-light/40 flex items-center justify-center flex-shrink-0 z-10">
                        <EventIcon iconKey={item.icon} />
                      </div>
                      <div className="min-w-0 flex-1 -mt-0.5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-medium text-charcoal">{item.title}</span>
                          <span className="text-xs text-warm-gray-light flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formattedTime}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-warm-gray mt-0.5">{item.description}</p>
                        )}
                        {item.venueName && (
                          <p className="text-xs text-warm-gray mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-sage" />
                            {item.mapsUrl ? (
                              <a
                                href={item.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sage-dark underline underline-offset-2"
                              >
                                {item.venueName}
                              </a>
                            ) : (
                              item.venueName
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-cream-dark p-4 text-center mb-4">
            <p className="text-sm text-warm-gray-light">Información práctica — próximamente</p>
          </div>
        )}

        {/* Coming soon sections */}
        <div className="space-y-4 mb-8">
          {['Nuestra historia', 'Transporte', 'Alojamiento'].map((section) => (
            <div
              key={section}
              className="bg-white rounded-xl border border-cream-dark p-4 text-center"
            >
              <p className="text-sm text-warm-gray-light">{section} — próximamente</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="w-8 h-px bg-sage mx-auto mb-4" />
          <p className="text-xs text-warm-gray-light">
            Con mucho cariño, Aránzazu & Agonay
          </p>
        </div>
      </div>
    </div>
  )
}
