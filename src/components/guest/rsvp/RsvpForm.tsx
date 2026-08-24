'use client'

import { useState } from 'react'
import { submitRsvp } from '@/features/rsvp/actions'
import { CheckCircle, AlertCircle, Pencil } from 'lucide-react'
import { RSVP_DEADLINE } from '@/lib/config'

interface Guest {
  id: string
  name: string
  firstName: string
  existingRsvp: Record<string, unknown> | null
}

interface RsvpFormProps {
  guests: Guest[]
  rsvpOpen: boolean
}

export default function RsvpForm({ guests, rsvpOpen }: RsvpFormProps) {
  const hasExistingRsvp = guests.some((g) => g.existingRsvp)
  const [isEditing, setIsEditing] = useState(hasExistingRsvp)
  const [responses, setResponses] = useState<Record<string, {
    attendance: string
    plus_one: boolean
    plus_one_name: string
    plus_one_dietary_notes: string
    dietary_notes: string
    transport_required: boolean
    accommodation_notes: string
    notes: string
  }>>(() => {
    const init: Record<string, any> = {}
    for (const g of guests) {
      const r = g.existingRsvp as Record<string, any> | null
      init[g.id] = {
        attendance: r?.attendance || '',
        plus_one: !!(r?.plus_one_name || r?.plus_one_dietary_notes),
        plus_one_name: r?.plus_one_name || '',
        plus_one_dietary_notes: r?.plus_one_dietary_notes || '',
        dietary_notes: r?.dietary_notes || '',
        transport_required: r?.transport_required || false,
        accommodation_notes: r?.accommodation_notes || '',
        notes: r?.notes || '',
      }
    }
    return init
  })
  const [step, setStep] = useState<'form' | 'submitting' | 'success' | 'edit_success' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState('')

  const allAnswered = guests.every((g) => {
    const r = responses[g.id]
    if (!r?.attendance) return false
    if (r.attendance === 'attending' && r.plus_one) {
      return r.plus_one_name.trim() !== '' && r.plus_one_dietary_notes.trim() !== ''
    }
    return true
  })

  const handleSubmit = async () => {
    setStep('submitting')
    try {
      await Promise.all(
        guests
          .filter((g) => responses[g.id].attendance)
          .map((g) => {
            const r = responses[g.id]
            const attending = r.attendance === 'attending'
            const withPlusOne = attending && r.plus_one
            return submitRsvp({
              guest_id: g.id,
              attendance: r.attendance,
              plus_one_name: withPlusOne ? r.plus_one_name.trim() : undefined,
              plus_one_dietary_notes: withPlusOne ? r.plus_one_dietary_notes.trim() : undefined,
              dietary_notes: r.dietary_notes || undefined,
              transport_required: r.transport_required || undefined,
              accommodation_notes: r.accommodation_notes || undefined,
              notes: r.notes || undefined,
            })
          })
      )
      setStep(hasExistingRsvp ? 'edit_success' : 'success')
    } catch {
      setErrorMessage('Error al guardar la confirmación. Inténtalo de nuevo.')
      setStep('error')
    }
  }

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-serif text-charcoal mb-2">
          ¡Gracias por confirmar!
        </h2>
        <p className="text-warm-gray">
          Hemos recibido vuestra respuesta. Nos vemos el 1 de mayo.
        </p>
        <button
          onClick={() => { setIsEditing(true); setStep('form') }}
          className="mt-4 inline-flex items-center gap-2 text-sm text-sage hover:text-sage-dark underline"
        >
          <Pencil className="h-4 w-4" />
          Modificar respuesta
        </button>
      </div>
    )
  }

  if (step === 'edit_success') {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-serif text-charcoal mb-2">
          ¡Respuesta actualizada!
        </h2>
        <p className="text-warm-gray">
          Hemos actualizado vuestra confirmación.
        </p>
        <button
          onClick={() => { setIsEditing(false); setStep('success') }}
          className="mt-4 text-sm text-sage hover:text-sage-dark underline"
        >
          Ver confirmación
        </button>
      </div>
    )
  }

  if (!rsvpOpen && !hasExistingRsvp) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <h2 className="text-xl font-serif text-charcoal mb-2">
          Plazo de confirmación cerrado
        </h2>
        <p className="text-warm-gray">
          El plazo para confirmar asistencia ha finalizado ({new Date(RSVP_DEADLINE).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}). Si necesitas hacer algún cambio, contáctanos directamente.
        </p>
      </div>
    )
  }

  if (hasExistingRsvp && !isEditing) {
    const attending = guests.filter((g) => (g.existingRsvp as any)?.attendance === 'attending').length
    return (
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-serif text-charcoal">
          {attending === guests.length ? '¡Confirmado!' : 'Respuesta guardada'}
        </h2>
        <p className="text-warm-gray text-sm">
          {attending === guests.length
            ? 'Todos asistirán. Nos vemos el 1 de mayo.'
            : 'Habéis confirmado vuestra respuesta.'}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-cream transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Modificar respuesta
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {guests.map((guest) => (
        <div key={guest.id} className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm">
          <h3 className="text-lg font-serif text-charcoal mb-4">{guest.name}</h3>

          {/* Attendance */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-warm-gray mb-2">
              ¿Asistirás?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResponses((prev) => ({
                  ...prev,
                  [guest.id]: { ...prev[guest.id], attendance: 'attending' }
                }))}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  responses[guest.id]?.attendance === 'attending'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cream border border-cream-dark text-charcoal hover:bg-cream-dark'
                }`}
              >
                Sí, ahí estaré
              </button>
              <button
                type="button"
                onClick={() => setResponses((prev) => ({
                  ...prev,
                  [guest.id]: { ...prev[guest.id], attendance: 'not_attending' }
                }))}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  responses[guest.id]?.attendance === 'not_attending'
                    ? 'bg-charcoal text-white'
                    : 'bg-cream border border-cream-dark text-charcoal hover:bg-cream-dark'
                }`}
              >
                No podré ir
              </button>
            </div>
          </div>

          {/* Extra fields when attending */}
          {responses[guest.id]?.attendance === 'attending' && (
            <div className="space-y-4 pt-4 border-t border-cream-dark">
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`plusone-${guest.id}`}
                    checked={responses[guest.id].plus_one}
                    onChange={(e) => setResponses((prev) => ({
                      ...prev,
                      [guest.id]: { ...prev[guest.id], plus_one: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                  />
                  <label htmlFor={`plusone-${guest.id}`} className="text-sm text-warm-gray">
                    Voy acompañado/a
                  </label>
                </div>

                {responses[guest.id].plus_one && (
                  <div className="space-y-4 mt-4 pl-7">
                    <div>
                      <label className="block text-sm font-medium text-warm-gray mb-1">
                        Nombre del acompañante *
                      </label>
                      <input
                        type="text"
                        value={responses[guest.id].plus_one_name}
                        onChange={(e) => setResponses((prev) => ({
                          ...prev,
                          [guest.id]: { ...prev[guest.id], plus_one_name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                        placeholder="Nombre y apellidos de tu acompañante"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-warm-gray mb-1">
                        Alergias o intolerancias del acompañante *
                      </label>
                      <input
                        type="text"
                        value={responses[guest.id].plus_one_dietary_notes}
                        onChange={(e) => setResponses((prev) => ({
                          ...prev,
                          [guest.id]: { ...prev[guest.id], plus_one_dietary_notes: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                        placeholder='Ej: gluten, frutos secos... o "ninguna"'
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-gray mb-1">
                  Alergias o intolerancias
                </label>
                <input
                  type="text"
                  value={responses[guest.id].dietary_notes}
                  onChange={(e) => setResponses((prev) => ({
                    ...prev,
                    [guest.id]: { ...prev[guest.id], dietary_notes: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Ej: gluten, frutos secos, lactosa..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`transport-${guest.id}`}
                  checked={responses[guest.id].transport_required}
                  onChange={(e) => setResponses((prev) => ({
                    ...prev,
                    [guest.id]: { ...prev[guest.id], transport_required: e.target.checked }
                  }))}
                  className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                />
                <label htmlFor={`transport-${guest.id}`} className="text-sm text-warm-gray">
                  Necesito transporte
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-gray mb-1">
                  ¿Dónde te alojas?
                </label>
                <input
                  type="text"
                  value={responses[guest.id].accommodation_notes}
                  onChange={(e) => setResponses((prev) => ({
                    ...prev,
                    [guest.id]: { ...prev[guest.id], accommodation_notes: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  placeholder="Nombre del hotel o alojamiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-gray mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={responses[guest.id].notes}
                  onChange={(e) => setResponses((prev) => ({
                    ...prev,
                    [guest.id]: { ...prev[guest.id], notes: e.target.value }
                  }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                  placeholder="Cualquier otra cosa que debamos saber..."
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {step === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || step === 'submitting'}
        className="w-full py-3 bg-charcoal text-white rounded-lg text-sm font-medium hover:bg-warm-gray transition-colors disabled:opacity-50"
      >
        {step === 'submitting' ? 'Guardando...' : (hasExistingRsvp ? 'Actualizar respuesta' : 'Confirmar asistencia')}
      </button>

      {hasExistingRsvp && (
        <div className="text-center">
          <button
            onClick={() => setIsEditing(false)}
            className="text-sm text-warm-gray-light hover:text-warm-gray underline"
          >
            Cancelar y ver confirmación
          </button>
        </div>
      )}
    </div>
  )
}
