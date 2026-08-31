'use client'

import { motion } from 'framer-motion'
import {
  Clock,
  Heart,
  Wine,
  UtensilsCrossed,
  Music,
  Bus,
  Camera,
  MapPin,
  Armchair,
  Check,
  ArrowUp,
  Sparkles,
} from 'lucide-react'
import VideoHero from './cinematic/VideoHero'
import CinematicSection, { FadeInUp, StaggerChildren } from './cinematic/CinematicSection'
import type { GuestRsvpSummary, ScheduleItem, SeatingItem } from './InvitationContent'
import {
  VENUE_NAME,
  COUPLE_NAMES,
} from '@/lib/cinematic-config'

interface Guest {
  id: string
  name: string
  firstName: string
  lastName: string
  hasRsvp: boolean
  attendance: string | null
  rsvp: GuestRsvpSummary | null
}

interface CinematicInvitationProps {
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
  return <Icon className="h-4 w-4 text-white" />
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

export default function CinematicInvitation({
  greeting,
  guests,
  weddingDate,
  token,
  schedule = [],
  seating = [],
}: CinematicInvitationProps) {
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
    <div className="relative bg-cream">
      {/* Scroll to top button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-charcoal/80 text-white shadow-lg backdrop-blur-sm"
      >
        <ArrowUp className="mx-auto h-5 w-5" />
      </motion.button>

      {/* Section 0: Video Hero */}
      <VideoHero greeting={greeting} weddingDate={weddingDate} />

      {/* Section 1: Wedding Details */}
      <CinematicSection bgColor="bg-cream" direction="up">
        <div className="mx-auto w-full max-w-lg px-6 py-20">
          <FadeInUp>
            <h2 className="mb-12 text-center text-3xl font-serif text-charcoal">
              Detalles de la boda
            </h2>
          </FadeInUp>

          <StaggerChildren className="space-y-4">
            <FadeInUp delay={0.1}>
              <div className="rounded-2xl border border-cream-dark bg-white/80 p-6 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-light/50">
                    <CalendarIcon className="h-5 w-5 text-sage-dark" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-warm-gray-light">Fecha</p>
                    <p className="font-serif capitalize text-charcoal">{formattedDate}</p>
                  </div>
                </div>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <div className="rounded-2xl border border-cream-dark bg-white/80 p-6 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-light/50">
                    <MapPin className="h-5 w-5 text-sage-dark" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-warm-gray-light">Lugar</p>
                    <p className="font-serif text-charcoal">{VENUE_NAME}</p>
                  </div>
                </div>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.3}>
              <div className="rounded-2xl border border-cream-dark bg-white/80 p-6 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-light/50">
                    <Heart className="h-5 w-5 text-sage-dark" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-warm-gray-light">
                      Invitados
                    </p>
                    <p className="font-serif text-charcoal">
                      {guests.map((g) => g.name.split(' ')[0]).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </FadeInUp>
          </StaggerChildren>
        </div>
      </CinematicSection>

      {/* Section 2: RSVP */}
      <CinematicSection
        bgColor="bg-gradient-to-b from-cream-dark to-cream"
        direction="up"
      >
        <div className="mx-auto w-full max-w-lg px-6 py-20">
          <FadeInUp>
            <h2 className="mb-2 text-center text-3xl font-serif text-charcoal">
              {rsvpTitle}
            </h2>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <p
              className={`mb-8 text-center text-sm ${
                allAnswered
                  ? allAttending
                    ? 'text-emerald-600'
                    : 'text-warm-gray'
                  : 'text-warm-gray'
              }`}
            >
              {allAnswered
                ? allAttending
                  ? 'Gracias por confirmar! Nos vemos el 1 de mayo.'
                  : 'Gracias por vuestra respuesta.'
                : 'Por favor, confirmad vuestra asistencia antes del 1 de abril de 2027.'}
            </p>
          </FadeInUp>

          {someRsvpd && (
            <StaggerChildren className="space-y-3 mb-8" staggerDelay={0.1}>
              {guests.map((g) =>
                g.rsvp ? (
                  <motion.div
                    key={g.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="rounded-2xl border border-cream-dark bg-white/80 p-5 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-charcoal">{g.name}</span>
                      <RsvpBadge guest={g} />
                    </div>
                    {g.rsvp.attendance === 'attending' && (
                      <div className="space-y-0.5">
                        {g.rsvp.plusOneName && (
                          <>
                            <DetailRow label="Acompañante" value={g.rsvp.plusOneName} />
                            <DetailRow
                              label="Alergias acompañante"
                              value={g.rsvp.plusOneDietaryNotes}
                            />
                          </>
                        )}
                        <DetailRow label="Alergias" value={g.rsvp.dietaryNotes} />
                        {g.rsvp.transportRequired !== null && (
                          <DetailRow
                            label="Transporte"
                            value={g.rsvp.transportRequired ? 'S' : 'No'}
                          />
                        )}
                        <DetailRow
                          label="Alojamiento"
                          value={g.rsvp.accommodationNotes}
                        />
                        <DetailRow label="Notas" value={g.rsvp.notes} />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={g.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="rounded-xl border border-dashed border-cream-dark p-4 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-warm-gray">{g.name}</span>
                    <RsvpBadge guest={g} />
                  </motion.div>
                ),
              )}
            </StaggerChildren>
          )}

          <FadeInUp delay={0.2}>
            <div className="text-center">
              <a
                href={`/i/${token}/rsvp`}
                className="inline-block rounded-lg bg-charcoal px-8 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-warm-gray"
              >
                {someRsvpd ? 'Modificar respuesta' : 'Confirmar'}
              </a>
            </div>
          </FadeInUp>
        </div>
      </CinematicSection>

      {/* Section 3: Seating */}
      {seating.length > 0 && (
        <CinematicSection bgColor="bg-white" direction="up">
          <div className="mx-auto w-full max-w-lg px-6 py-20 text-center">
            <FadeInUp>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40">
                <Armchair className="h-7 w-7 text-sage-dark" />
              </div>
              <h2 className="mb-2 text-3xl font-serif text-charcoal">Tu mesa</h2>
              <p className="mb-8 text-sm text-warm-gray-light">Te esperamos en:</p>
            </FadeInUp>

            <StaggerChildren className="space-y-4" staggerDelay={0.15}>
              {seating.map((s) => (
                <FadeInUp key={s.guestName}>
                  <div className="flex items-center justify-center gap-4 rounded-2xl border border-cream-dark bg-cream/50 p-5">
                    <span className="text-charcoal font-medium">{s.guestName}</span>
                    <span className="text-warm-gray-light">·</span>
                    <span className="inline-flex rounded-full bg-sage-light/40 px-4 py-1.5 text-sm font-medium text-sage-dark">
                      {s.tableName}
                    </span>
                  </div>
                </FadeInUp>
              ))}
            </StaggerChildren>
          </div>
        </CinematicSection>
      )}

      {/* Section 4: Timeline */}
      {schedule.length > 0 ? (
        <CinematicSection bgColor="bg-cream" direction="up">
          <div className="mx-auto w-full max-w-lg px-6 py-20">
            <FadeInUp>
              <h2 className="mb-1 text-center text-3xl font-serif text-charcoal">
                El gran día
              </h2>
              <p className="mb-10 text-center text-sm text-warm-gray-light">
                Así viviremos el 1 de mayo
              </p>
            </FadeInUp>

            <div className="relative">
              {schedule.map((item, index) => {
                const prevItem = index > 0 ? schedule[index - 1] : null
                const showDateHeader = !prevItem || prevItem.eventDate !== item.eventDate
                const formattedTime = `${item.startTime.slice(0, 5)}${
                  item.endTime ? ` – ${item.endTime.slice(0, 5)}` : ''
                }`

                return (
                  <FadeInUp key={`${item.eventDate}-${item.startTime}-${item.title}`} delay={index * 0.1}>
                    {showDateHeader && (
                      <p className="mb-4 mt-2 text-xs font-medium uppercase tracking-wide text-sage-dark first:mt-0 capitalize">
                        {new Date(`${item.eventDate}T12:00:00`).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    )}
                    <div className="relative flex gap-4 pb-6 last:pb-0">
                      {index < schedule.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-sage-light" />
                      )}
                      <div className="z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sage-dark shadow-md">
                        <EventIcon iconKey={item.icon} />
                      </div>
                      <div className="min-w-0 flex-1 -mt-0.5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-medium text-charcoal">{item.title}</span>
                          <span className="flex items-center gap-1 text-xs text-warm-gray-light">
                            <Clock className="h-3 w-3" />
                            {formattedTime}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-sm text-warm-gray">{item.description}</p>
                        )}
                        {item.venueName && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-warm-gray">
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
                  </FadeInUp>
                )
              })}
            </div>
          </div>
        </CinematicSection>
      ) : (
        <CinematicSection bgColor="bg-cream" direction="up">
          <div className="mx-auto w-full max-w-lg px-6 py-20 text-center">
            <FadeInUp>
              <div className="rounded-2xl border border-cream-dark bg-white/80 p-6 text-center backdrop-blur-sm">
                <p className="text-sm text-warm-gray-light">
                  Información práctica — próximamente
                </p>
              </div>
            </FadeInUp>
          </div>
        </CinematicSection>
      )}

      {/* Section 5: Coming Soon + Footer */}
      <CinematicSection
        bgColor="bg-gradient-to-b from-cream to-charcoal"
        direction="up"
        className="pb-20"
      >
        <div className="mx-auto w-full max-w-lg px-6 py-20">
          <FadeInUp>
            <h2 className="mb-8 text-center text-2xl font-serif text-charcoal">
              Próximamente
            </h2>
          </FadeInUp>

          <StaggerChildren className="space-y-4 mb-16" staggerDelay={0.12}>
            {['Nuestra historia', 'Transporte', 'Alojamiento'].map((section) => (
              <FadeInUp key={section}>
                <div className="rounded-2xl border border-cream-dark bg-white/70 p-5 text-center backdrop-blur-sm">
                  <Sparkles className="mx-auto mb-2 h-5 w-5 text-sage" />
                  <p className="text-sm text-warm-gray-light">{section} — próximamente</p>
                </div>
              </FadeInUp>
            ))}
          </StaggerChildren>

          <FadeInUp delay={0.3}>
            <div className="text-center">
              <div className="mx-auto mb-4 h-px w-12 bg-sage/60" />
              <p className="text-xs tracking-widest uppercase text-warm-gray-light">
                Con mucho cariño, {COUPLE_NAMES}
              </p>
            </div>
          </FadeInUp>
        </div>
      </CinematicSection>
    </div>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
