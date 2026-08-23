'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import {
  createVenue,
  updateVenue,
  deleteVenue,
  type VenueInput,
} from '@/features/logistics/actions'

interface Venue {
  id: string
  name: string
  kind: string
  address: string | null
  maps_url: string | null
  notes: string | null
  sort_order: number
}

const KINDS = [
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'coctel', label: 'Cóctel' },
  { value: 'banquete', label: 'Banquete' },
  { value: 'otro', label: 'Otro' },
]

const KIND_COLORS: Record<string, string> = {
  ceremonia: 'bg-sage-light/40 text-sage-dark border-sage-light',
  coctel: 'bg-gold-light/40 text-charcoal border-gold-light',
  banquete: 'bg-terracotta-light/40 text-charcoal border-terracotta-light',
  otro: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function VenueManager({ venues }: { venues: Venue[] }) {
  const [editing, setEditing] = useState<Venue | null>(null)
  const [creating, setCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este lugar? Los eventos asociados quedarán sin lugar.')) return
    try {
      await deleteVenue(id)
    } catch {
      alert('Error al eliminar el lugar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Lugares</h2>
          <p className="text-sm text-gray-500">Ceremonia, cóctel, banquete y otros puntos clave</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir lugar
        </button>
      </div>

      {venues.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay lugares. Añade la finca, la iglesia o el salón.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{venue.name}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${KIND_COLORS[venue.kind] || KIND_COLORS.otro}`}>
                        {KINDS.find((k) => k.value === venue.kind)?.label || venue.kind}
                      </span>
                    </div>
                    {venue.address && <p className="text-sm text-gray-500 mt-1">{venue.address}</p>}
                    {venue.maps_url && (
                      <a
                        href={venue.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Ver en Google Maps →
                      </a>
                    )}
                    {venue.notes && <p className="text-xs text-gray-400 italic mt-1">{venue.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(venue)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(venue.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <VenueFormModal
          venue={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function VenueFormModal({ venue, onClose }: { venue: Venue | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: venue?.name || '',
    kind: venue?.kind || 'ceremonia',
    address: venue?.address || '',
    maps_url: venue?.maps_url || '',
    notes: venue?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data: VenueInput = {
      name: form.name.trim(),
      kind: form.kind,
      address: form.address.trim() || null,
      maps_url: form.maps_url.trim() || null,
      notes: form.notes.trim() || null,
    }
    try {
      if (venue) {
        await updateVenue(venue.id, data)
      } else {
        await createVenue(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el lugar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{venue ? 'Editar lugar' : 'Nuevo lugar'}</h2>
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
              placeholder="P.ej. Finca El Olivar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de Google Maps</label>
            <input
              type="url"
              value={form.maps_url}
              onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://maps.google.com/..."
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
