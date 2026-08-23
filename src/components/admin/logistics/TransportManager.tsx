'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Bus } from 'lucide-react'
import {
  createTransportOption,
  updateTransportOption,
  deleteTransportOption,
  type TransportOptionInput,
} from '@/features/logistics/actions'

interface TransportOption {
  id: string
  name: string
  direction: string
  origin: string | null
  destination: string | null
  departure_time: string | null
  return_time: string | null
  capacity: number | null
  notes: string | null
}

const DIRECTIONS = [
  { value: 'ida', label: 'Ida' },
  { value: 'vuelta', label: 'Vuelta' },
  { value: 'ida_vuelta', label: 'Ida y vuelta' },
]

export default function TransportManager({ options }: { options: Omit<TransportOption, 'rsvps'>[] }) {
  const [editing, setEditing] = useState<TransportOption | null>(null)
  const [creating, setCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este transporte? Los invitados asignados quedarán sin asignación.')) return
    try {
      await deleteTransportOption(id)
    } catch {
      alert('Error al eliminar el transporte')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Opciones de transporte</h2>
          <p className="text-sm text-gray-500">Autobuses y desplazamientos ofrecidos a los invitados</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir transporte
        </button>
      </div>

      {options.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay opciones de transporte. Crea el autobús de ida o vuelta.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <div key={option.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <Bus className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">{option.name}</span>
                    <p className="text-xs text-warm-gray mt-0.5">
                      {DIRECTIONS.find((d) => d.value === option.direction)?.label || option.direction}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {option.departure_time && <span>Salida: {option.departure_time.slice(0, 5)}</span>}
                      {option.return_time && <span>Regreso: {option.return_time.slice(0, 5)}</span>}
                      {option.origin && <span>Desde: {option.origin}</span>}
                      {option.destination && <span>Hasta: {option.destination}</span>}
                      {option.capacity != null && <span>Aforo: {option.capacity}</span>}
                    </div>
                    {option.notes && <p className="text-xs text-gray-400 italic mt-1">{option.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(option)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(option.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <TransportFormModal
          option={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function TransportFormModal({
  option,
  onClose,
}: {
  option: TransportOption | null
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: option?.name || '',
    direction: option?.direction || 'ida',
    origin: option?.origin || '',
    destination: option?.destination || '',
    departure_time: option?.departure_time?.slice(0, 5) || '',
    return_time: option?.return_time?.slice(0, 5) || '',
    capacity: option?.capacity?.toString() || '',
    notes: option?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data: TransportOptionInput = {
      name: form.name.trim(),
      direction: form.direction,
      origin: form.origin.trim() || null,
      destination: form.destination.trim() || null,
      departure_time: form.departure_time || null,
      return_time: form.return_time || null,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      notes: form.notes.trim() || null,
    }
    try {
      if (option) {
        await updateTransportOption(option.id, data)
      } else {
        await createTransportOption(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el transporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{option ? 'Editar transporte' : 'Nuevo transporte'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="P.ej. Autobús invitados (ida)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <select
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="P.ej. Ayuntamiento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de salida</label>
              <input
                type="time"
                value={form.departure_time}
                onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de regreso</label>
              <input
                type="time"
                value={form.return_time}
                onChange={(e) => setForm({ ...form, return_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aforo</label>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
