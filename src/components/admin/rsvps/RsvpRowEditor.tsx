'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { updateGuestRsvp } from '@/features/guests/actions'

interface RsvpRowEditorProps {
  guestId: string
  rsvp: {
    attendance: string | null
    plus_one_name: string | null
    plus_one_dietary_notes: string | null
    dietary_notes: string | null
    transport_required: boolean | null
    accommodation_notes: string | null
    notes: string | null
  }
  plusOneAllowed: boolean
}

export default function RsvpRowEditor({ guestId, rsvp, plusOneAllowed }: RsvpRowEditorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    attendance: rsvp.attendance || '',
    plus_one: !!(rsvp.plus_one_name || rsvp.plus_one_dietary_notes),
    plus_one_name: rsvp.plus_one_name || '',
    plus_one_dietary_notes: rsvp.plus_one_dietary_notes || '',
    dietary_notes: rsvp.dietary_notes || '',
    transport_required: rsvp.transport_required || false,
    accommodation_notes: rsvp.accommodation_notes || '',
    notes: rsvp.notes || '',
  })

  const openModal = () => {
    setForm({
      attendance: rsvp.attendance || '',
      plus_one: !!(rsvp.plus_one_name || rsvp.plus_one_dietary_notes),
      plus_one_name: rsvp.plus_one_name || '',
      plus_one_dietary_notes: rsvp.plus_one_dietary_notes || '',
      dietary_notes: rsvp.dietary_notes || '',
      transport_required: rsvp.transport_required || false,
      accommodation_notes: rsvp.accommodation_notes || '',
      notes: rsvp.notes || '',
    })
    setError(null)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const attending = form.attendance === 'attending'
      const withPlusOne = attending && form.plus_one && plusOneAllowed
      await updateGuestRsvp(guestId, {
        attendance: form.attendance || null,
        plus_one_name: withPlusOne ? form.plus_one_name.trim() || null : null,
        plus_one_dietary_notes: withPlusOne ? form.plus_one_dietary_notes.trim() || null : null,
        dietary_notes: form.dietary_notes || null,
        transport_required: form.transport_required || null,
        accommodation_notes: form.accommodation_notes || null,
        notes: form.notes || null,
        admin_notified: false,
      })
      setOpen(false)
      router.refresh()
    } catch {
      setError('Error al guardar el RSVP.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <>
      <button
        onClick={openModal}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        title="Editar RSVP"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Editar RSVP</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asistencia</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, attendance: 'attending' })}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      form.attendance === 'attending'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-50 border text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Asiste
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, attendance: 'not_attending' })}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      form.attendance === 'not_attending'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 border text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    No asiste
                  </button>
                </div>
              </div>

              {form.attendance === 'attending' && (
                <>
                  {plusOneAllowed && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="plusone-rsvp-edit"
                        checked={form.plus_one}
                        onChange={(e) => setForm({ ...form, plus_one: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="plusone-rsvp-edit" className="text-sm text-gray-600">Va acompañado/a</label>
                    </div>
                  )}

                  {form.plus_one && plusOneAllowed && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del acompañante *</label>
                        <input
                          type="text"
                          value={form.plus_one_name}
                          onChange={(e) => setForm({ ...form, plus_one_name: e.target.value })}
                          className={inputCls}
                          placeholder="Nombre y apellidos"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alergias del acompañante *</label>
                        <input
                          type="text"
                          value={form.plus_one_dietary_notes}
                          onChange={(e) => setForm({ ...form, plus_one_dietary_notes: e.target.value })}
                          className={inputCls}
                          placeholder='Ej: gluten... o "ninguna"'
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias / intolerancias</label>
                    <input
                      type="text"
                      value={form.dietary_notes}
                      onChange={(e) => setForm({ ...form, dietary_notes: e.target.value })}
                      className={inputCls}
                      placeholder="Ej: gluten, frutos secos..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="transport-rsvp-edit"
                      checked={form.transport_required}
                      onChange={(e) => setForm({ ...form, transport_required: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="transport-rsvp-edit" className="text-sm text-gray-600">Necesita transporte</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alojamiento</label>
                    <input
                      type="text"
                      value={form.accommodation_notes}
                      onChange={(e) => setForm({ ...form, accommodation_notes: e.target.value })}
                      className={inputCls}
                      placeholder="Hotel o alojamiento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none`}
                      placeholder="Cualquier otra cosa..."
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  !form.attendance ||
                  (form.plus_one && (!form.plus_one_name.trim() || !form.plus_one_dietary_notes.trim()))
                }
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
