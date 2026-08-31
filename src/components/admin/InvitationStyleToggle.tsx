'use client'

import { useState } from 'react'
import { setFeatureFlag } from '@/features/music/actions'
import { Sparkles, Layout } from 'lucide-react'

export default function InvitationStyleToggle({ initialValue }: { initialValue: boolean }) {
  const [active, setActive] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    setSaving(true)
    const newValue = !active
    await setFeatureFlag('invitation_style_cinematic', newValue)
    setActive(newValue)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {active ? (
            <div className="w-10 h-10 rounded-full bg-sage-light/50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-sage-dark" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center flex-shrink-0">
              <Layout className="h-5 w-5 text-warm-gray" />
            </div>
          )}
          <div>
            <h3 className="text-base font-medium text-gray-900">Estilo de invitación</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {active
                ? 'Cinemática — Página con scroll, animaciones y vídeo de fondo'
                : 'Clásica — Tarjetas estáticas con información de la boda'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
            active ? 'bg-sage' : 'bg-gray-300'
          } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          aria-label={active ? 'Cambiar a estilo clásico' : 'Cambiar a estilo cinemático'}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              active ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {active && (
        <div className="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
          <p>Con esta opción activada:</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-500">
            <li>La invitación muestra un <strong>hero a pantalla completa</strong> con vídeo (cuando se configure)</li>
            <li>Las secciones aparecen con <strong>animaciones al hacer scroll</strong></li>
            <li>El fondo cambia sutilmente entre secciones</li>
            <li>Botón flotante para volver arriba</li>
          </ul>
        </div>
      )}
    </div>
  )
}
