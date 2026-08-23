interface Guest {
  id: string
  name: string
  firstName: string
  lastName: string
  hasRsvp: boolean
  attendance: string | null
}

interface InvitationContentProps {
  greeting: string
  guests: Guest[]
  weddingDate: string
  token: string
}

export default function InvitationContent({ greeting, guests, weddingDate, token }: InvitationContentProps) {
  const date = new Date(weddingDate)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const someRsvpd = guests.some((g) => g.hasRsvp)
  const allAttending = guests.every((g) => g.attendance === 'attending')

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sage text-sm tracking-widest uppercase mb-6">
            ¡Nos casamos!
          </p>
          <h1 className="text-5xl md:text-6xl font-serif text-charcoal mb-6">
            Arancha <span className="text-sage">&</span> Agonay
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
        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm mb-8 text-center">
          <h2 className="text-lg font-serif text-charcoal mb-2">
            {someRsvpd && allAttending ? 'Confirmado' : 'Confirmar asistencia'}
          </h2>
          {someRsvpd && allAttending ? (
            <p className="text-sm text-emerald-600 mb-4">
              ¡Gracias por confirmar! Nos vemos el 1 de mayo.
            </p>
          ) : (
            <p className="text-sm text-warm-gray mb-4">
              Por favor, confirmad vuestra asistencia antes del 1 de abril de 2027.
            </p>
          )}
          <a
            href={`/i/${token}/rsvp`}
            className="inline-block px-6 py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-warm-gray transition-colors"
          >
            {someRsvpd && allAttending ? 'Modificar respuesta' : 'Confirmar'}
          </a>
        </div>

        {/* Coming soon sections */}
        <div className="space-y-4">
          {['Nuestra historia', 'Información práctica', 'Transporte', 'Alojamiento'].map((section) => (
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
            Con mucho cariño, Arancha & Agonay
          </p>
        </div>
      </div>
    </div>
  )
}
