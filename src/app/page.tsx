import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sage text-sm tracking-widest uppercase mb-4">
          ¡Nos casamos!
        </p>
        <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-4">
          Arancha & Agonay
        </h1>
        <div className="w-16 h-px bg-sage mx-auto my-6" />
        <p className="text-warm-gray text-lg mb-8">
          1 de mayo, 2027
        </p>
        <p className="text-warm-gray-light text-sm">
          Si has recibido una invitación, escanea el código QR para acceder a
          tu portal personalizado.
        </p>
        <div className="mt-12">
          <Link
            href="/admin"
            className="text-xs text-warm-gray-light hover:text-warm-gray transition-colors underline"
          >
            Acceso administradores
          </Link>
        </div>
      </div>
    </div>
  )
}
