'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

export default function CheckInButton({ token }: { token: string }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        setCheckedIn(true)
      } else {
        setError(data.error || 'Error al confirmar llegada')
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (checkedIn) {
    return (
      <div className="w-full px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl text-center font-medium flex items-center justify-center gap-2">
        <Check className="h-5 w-5" />
        ¡Llegada confirmada!
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full px-6 py-3 bg-sage text-white rounded-xl text-center font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Confirmando...
          </>
        ) : (
          <>
            <Check className="h-5 w-5" />
            Confirmar llegada
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
    </div>
  )
}
