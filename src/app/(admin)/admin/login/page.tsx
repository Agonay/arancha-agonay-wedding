'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useGoogle, setUseGoogle] = useState(false)
  const router = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard`,
        },
      })

      if (error) throw error

      setMessage('Enlace enviado. Revisa tu correo.')
    } catch (err) {
      setError('No se pudo enviar el enlace. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError('No se pudo iniciar sesión con Google.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-semibold text-charcoal mb-2">
            Arancha & Agonay
          </h1>
          <p className="text-warm-gray">Panel de administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {!useGoogle ? (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-charcoal mb-1"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-warm-gray-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                    placeholder="tu@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-charcoal text-white py-2.5 text-sm font-medium hover:bg-warm-gray transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace mágico'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-warm-gray-light">o</span>
                </div>
              </div>

              <button
                onClick={() => setUseGoogle(true)}
                className="w-full rounded-lg border border-warm-gray-light bg-white py-2.5 text-sm font-medium text-charcoal hover:bg-cream transition-colors"
              >
                Continuar con Google
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full rounded-lg bg-charcoal text-white py-2.5 text-sm font-medium hover:bg-warm-gray transition-colors disabled:opacity-50"
              >
                Iniciar sesión con Google
              </button>
              <button
                onClick={() => setUseGoogle(false)}
                className="w-full rounded-lg border border-warm-gray-light bg-white py-2.5 text-sm font-medium text-charcoal hover:bg-cream transition-colors"
              >
                Volver al enlace mágico
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
