'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const callbackUrl = `${origin}/admin/auth/callback`

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
          emailRedirectTo: callbackUrl,
        },
      })

      if (error) throw error

      setMessage('Enlace enviado. Revisa tu correo.')
    } catch {
      setError('No se pudo enviar el enlace. Inténtalo de nuevo.')
    } finally {
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
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

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

          <p className="text-xs text-warm-gray-light text-center">
            Se enviará un enlace mágico a tu correo. Haz clic en el enlace para acceder al panel.
          </p>
        </div>
      </div>
    </div>
  )
}
