'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react'
import {
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  type AccommodationInput,
} from '@/features/logistics/actions'

interface Accommodation {
  id: string
  hotel_name: string
  address: string | null
  booking_code: string | null
  phone: string | null
  price_note: string | null
  check_in: string | null
  check_out: string | null
  notes: string | null
}

export default function AccommodationManager({ accommodations }: { accommodations: Accommodation[] }) {
  const [editing, setEditing] = useState<Accommodation | null>(null)
  const [creating, setCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este alojamiento?')) return
    try {
      await deleteAccommodation(id)
    } catch {
      alert('Error al eliminar el alojamiento')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Alojamiento</h2>
          <p className="text-sm text-gray-500">Hoteles y bloques de habitaciones reservados</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir alojamiento
        </button>
      </div>

      {accommodations.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay alojamientos. Añade los hoteles con bloque reservado.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {accommodations.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <BedDouble className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">{acc.hotel_name}</span>
                    {acc.address && <p className="text-sm text-gray-500 mt-1">{acc.address}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {acc.booking_code && (
                        <span>
                          Código: <span className="font-medium text-charcoal">{acc.booking_code}</span>
                        </span>
                      )}
                      {acc.phone && <span>Tel: {acc.phone}</span>}
                      {(acc.check_in || acc.check_out) && (
                        <span>
                          {acc.check_in && new Date(`${acc.check_in}T12:00:00`).toLocaleDateString('es-ES')}
                          {' – '}
                          {acc.check_out && new Date(`${acc.check_out}T12:00:00`).toLocaleDateString('es-ES')}
                        </span>
                      )}
                      {acc.price_note && <span>{acc.price_note}</span>}
                    </div>
                    {acc.notes && <p className="text-xs text-gray-400 italic mt-1">{acc.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(acc)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <AccommodationFormModal
          accommodation={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function AccommodationFormModal({
  accommodation,
  onClose,
}: {
  accommodation: Accommodation | null
  onClose: () => void
}) {
  const [form, setForm] = useState({
    hotel_name: accommodation?.hotel_name || '',
    address: accommodation?.address || '',
    booking_code: accommodation?.booking_code || '',
    phone: accommodation?.phone || '',
    price_note: accommodation?.price_note || '',
    check_in: accommodation?.check_in || '',
    check_out: accommodation?.check_out || '',
    notes: accommodation?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data: AccommodationInput = {
      hotel_name: form.hotel_name.trim(),
      address: form.address.trim() || null,
      booking_code: form.booking_code.trim() || null,
      phone: form.phone.trim() || null,
      price_note: form.price_note.trim() || null,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      notes: form.notes.trim() || null,
    }
    try {
      if (accommodation) {
        await updateAccommodation(accommodation.id, data)
      } else {
        await createAccommodation(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el alojamiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{accommodation ? 'Editar alojamiento' : 'Nuevo alojamiento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
            <input
              type="text"
              required
              value={form.hotel_name}
              onChange={(e) => setForm({ ...form, hotel_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de reserva</label>
              <input
                type="text"
                value={form.booking_code}
                onChange={(e) => setForm({ ...form, booking_code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="P.ej. BODA2027"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                value={form.check_in}
                onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                value={form.check_out}
                onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio / nota</label>
            <input
              type="text"
              value={form.price_note}
              onChange={(e) => setForm({ ...form, price_note: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="P.ej. 75€/noche habitación doble"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
