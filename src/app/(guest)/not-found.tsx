import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-serif text-charcoal mb-4">
          No encontramos esta invitación
        </h1>
        <p className="text-warm-gray mb-8">
          Por favor, escanea el código QR de nuevo o contáctanos si el problema
          persiste.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-charcoal text-white px-6 py-2.5 text-sm font-medium hover:bg-warm-gray transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
