'use client'

import { useActionState } from 'react'
import { Headphones } from 'lucide-react'
import { djLogin, type DjLoginState } from '@/features/dj/actions'

export default function DjLoginPage() {
  const [state, formAction, pending] = useActionState<DjLoginState, FormData>(djLogin, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-sage-light/40 flex items-center justify-center">
            <Headphones className="h-7 w-7 text-sage-dark" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-charcoal mb-2">
            Zona del DJ
          </h1>
          <p className="text-warm-gray text-sm">
            Accede a la cola de canciones propuestas por los invitados
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {state.error}
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
                Contraseña del DJ
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                placeholder="••••••••"
                className="w-full rounded-lg border border-warm-gray-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-sage text-white py-2.5 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50"
            >
              {pending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
