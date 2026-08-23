'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Suspense } from 'react'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const code = searchParams?.get('code')

        if (code) {
          // PKCE flow: exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        } else {
          // Hash-based flow (legacy)
          const { error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
        }

        // Verify session exists
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('No se encontró la sesión. Intenta de nuevo.')
          return
        }

        // Redirect to dashboard - server layout will check email allowlist
        router.push('/admin/dashboard')
        router.refresh()
      } catch {
        setError('Error al procesar el enlace de autenticación.')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/admin/login" className="text-sm text-charcoal underline hover:text-warm-gray">
            Volver al login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <p className="text-warm-gray">Iniciando sesión...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <p className="text-warm-gray">Cargando...</p>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  )
}
