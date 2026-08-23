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

        // Check for PKCE code in URL
        const code = searchParams?.get('code')

        if (code) {
          // Exchange PKCE code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('PKCE exchange error:', exchangeError)
            setError('No se pudo completar el inicio de sesión.')
            return
          }
        }

        // Check for hash-based session (legacy flow)
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          const { error: hashError } = await supabase.auth.getSession()
          if (hashError) {
            console.error('Hash session error:', hashError)
          }
        }

        // Verify we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Get session error:', sessionError)
        }

        if (!session) {
          setError('No se encontró la sesión. Intenta de nuevo desde el login.')
          return
        }

        // Redirect to dashboard (server layout checks email allowlist)
        router.push('/admin/dashboard')
      } catch (err) {
        console.error('Auth callback error:', err)
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
