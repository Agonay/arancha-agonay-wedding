'use client'

import { useState } from 'react'
import { Clock, Music, CalendarDays, Heart, Wine, UtensilsCrossed, Bus, Camera, MapPin, Armchair } from 'lucide-react'
import MusicProposalForm from './MusicProposalForm'
import CheckInButton from './CheckInButton'

interface ScheduleItem {
  title: string
  description: string | null
  eventDate: string
  startTime: string
  endTime: string | null
  icon: string | null
  venueName: string | null
  mapsUrl: string | null
}

interface SeatingItem {
  guestName: string
  tableName: string
}

interface Guest {
  id: string
  name: string
  firstName: string
  lastName: string
  hasRsvp: boolean
  attendance: string | null
  rsvp: {
    attendance: string
    plusOneName: string | null
    plusOneDietaryNotes: string | null
    dietaryNotes: string | null
    transportRequired: boolean | null
    accommodationNotes: string | null
    notes: string | null
  } | null
}

interface PlaylistItem {
  title: string
  artist: string
  spotify_url: string | null
  youtube_url: string | null
  deezer_url: string | null
  album_art_url: string | null
  moment_category: string
}

interface WeddingDayTabsProps {
  greeting: string
  guests: Guest[]
  weddingDate: string
  token: string
  schedule: ScheduleItem[]
  seating: SeatingItem[]
  playlist: PlaylistItem[]
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

function ScheduleTab({ schedule }: { schedule: ScheduleItem[] }) {
  if (schedule.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
        <p className="text-sm text-warm-gray-light">El horario del día se publicará próximamente</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
      <h2 className="text-lg font-serif text-charcoal mb-1 text-center">
        Horario del día
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
  )
}

export default function WeddingDayTabs({
  greeting,
  guests,
  weddingDate,
  token,
  schedule,
  seating,
  playlist,
}: WeddingDayTabsProps) {
  const [activeTab, setActiveTab] = useState<'horario' | 'musica'>('horario')

  const date = new Date(weddingDate)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <p className="text-sage text-sm tracking-widest uppercase mb-4">
            ¡Es hoy!
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-4">
            Aránzazu <span className="text-sage">&</span> Agonay
          </h1>
          <div className="w-16 h-px bg-sage mx-auto" />
        </div>

        <div className="text-center mb-6">
          <p className="text-xl text-warm-gray font-serif italic mb-2">
            Hola {greeting}
          </p>
        </div>

        <div className="mb-6">
          <CheckInButton token={token} />
        </div>

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-cream-dark mb-6">
          <button
            onClick={() => setActiveTab('horario')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'horario'
                ? 'bg-sage text-white shadow-sm'
                : 'text-warm-gray hover:text-charcoal'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Horario
          </button>
          <button
            onClick={() => setActiveTab('musica')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'musica'
                ? 'bg-sage text-white shadow-sm'
                : 'text-warm-gray hover:text-charcoal'
            }`}
          >
            <Music className="h-4 w-4" />
            Música
          </button>
        </div>

        {activeTab === 'horario' ? (
          <div className="space-y-6">
            <ScheduleTab schedule={schedule} />

            {seating.length > 0 && (
              <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm text-center">
                <h2 className="text-lg font-serif text-charcoal mb-1">Tu mesa</h2>
                <div className="space-y-3 mt-4">
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
          </div>
        ) : (
          <div className="space-y-6">
            {playlist.length > 0 && (
              <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
                <h2 className="text-lg font-serif text-charcoal mb-1 text-center">
                  Nuestra playlist
                </h2>
                <p className="text-sm text-warm-gray-light text-center mb-4">
                  Las canciones que hemos elegido para nuestro día
                </p>
                <div className="space-y-2">
                  {playlist.map((song, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream">
                      {song.album_art_url ? (
                        <img
                          src={song.album_art_url}
                          alt=""
                          className="h-10 w-10 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-cream-dark/50 flex items-center justify-center flex-shrink-0">
                          <Music className="h-4 w-4 text-sage" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-charcoal truncate">{song.title}</p>
                        <p className="text-xs text-warm-gray truncate">{song.artist}</p>
                      </div>
                      {song.spotify_url && (
                        <a
                          href={song.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-green-500"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                        </a>
                      )}
                      {song.youtube_url && (
                        <a
                          href={song.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <MusicProposalForm token={token} />
          </div>
        )}

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
