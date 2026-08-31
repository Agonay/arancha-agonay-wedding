'use client'

import { useState } from 'react'
import { setFeatureFlag } from '@/features/music/actions'
import { PartyPopper, AlertTriangle } from 'lucide-react'

export default function WeddingDayToggle({ initialValue }: { initialValue: boolean }) {
  const [active, setActive] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    setSaving(true)
    const newValue = !active
    await setFeatureFlag('wedding_day_mode', newValue)
    setActive(newValue)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {active ? (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <PartyPopper className="h-5 w-5 text-emerald-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          )}
          <div>
            <h3 className="text-base font-medium text-gray-900">Modo día de la boda</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {active
                ? 'Activado — Los invitados ven la vista con pestañas (Horario + Música)'
                : 'Desactivado — Los invitados ven la invitación estándar'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
            active ? 'bg-emerald-500' : 'bg-gray-300'
          } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          aria-label={active ? 'Desactivar modo día de la boda' : 'Activar modo día de la boda'}
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
            <li>La página de invitación muestra pestañas <strong>Horario</strong> y <strong>Música</strong></li>
            <li>Los invitados pueden proponer canciones para la fiesta</li>
            <li>El DJ ve las propuestas en tiempo real en <a href="/admin/dj" className="text-sage-dark underline">/admin/dj</a></li>
          </ul>
        </div>
      )}
    </div>
  )
}
