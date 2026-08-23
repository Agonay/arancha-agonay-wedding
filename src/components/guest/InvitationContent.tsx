interface InvitationContentProps {
  greeting: string
  guests: string[]
}

export default function InvitationContent({ greeting, guests }: InvitationContentProps) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="mb-12">
          <p className="text-sage text-sm tracking-widest uppercase mb-4">
            ¡Nos casamos!
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-4">
            Arancha & Agonay
          </h1>
          <div className="w-16 h-px bg-sage mx-auto my-6" />
          <p className="text-xl text-warm-gray font-serif italic">
            Hola {greeting}
          </p>
          <p className="text-warm-gray mt-3">
            Estamos muy felices de que formes parte de nuestro día especial.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-serif text-charcoal">Detalles</h2>
          <div className="space-y-3 text-sm text-warm-gray">
            <div className="flex justify-between">
              <span>Fecha</span>
              <span className="font-medium text-charcoal">1 de mayo, 2027</span>
            </div>
            <div className="flex justify-between">
              <span>Invitados</span>
              <span className="font-medium text-charcoal">
                {guests.join(', ')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-warm-gray-light text-xs">
          Más información próximamente
        </div>
      </div>
    </div>
  )
}
