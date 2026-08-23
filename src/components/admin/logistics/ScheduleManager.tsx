'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, Heart, Wine, UtensilsCrossed, Music, Bus, Camera } from 'lucide-react'
import {
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
  type ScheduleEventInput,
} from '@/features/logistics/actions'

interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string | null
  venue_id: string | null
  venues: { id: string; name: string } | null
  icon: string | null
  is_public: boolean
  sort_order: number
}

const ICONS = [
  { value: 'heart', label: 'Ceremonia', component: Heart },
  { value: 'wine', label: 'Cóctel', component: Wine },
  { value: 'dinner', label: 'Banquete', component: UtensilsCrossed },
  { value: 'party', label: 'Fiesta', component: Music },
  { value: 'bus', label: 'Transporte', component: Bus },
  { value: 'camera', label: 'Fotos', component: Camera },
]

export function EventIcon({ iconKey, className }: { iconKey: string | null; className?: string }) {
  const match = ICONS.find((i) => i.value === iconKey)
  const Icon = match?.component || Clock
  return <Icon className={className} />
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function ScheduleManager({
  events,
  venues,
}: {
  events: ScheduleEvent[]
  venues: { id: string; name: string }[]
}) {
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [creating, setCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento del horario?')) return
    try {
      await deleteScheduleEvent(id)
    } catch {
      alert('Error al eliminar el evento')
    }
  }

  // Group events by date for display
  const byDate = events.reduce<Record<string, ScheduleEvent[]>>((acc, event) => {
    ;(acc[event.event_date] ||= []).push(event)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Horario del día</h2>
          <p className="text-sm text-gray-500">Cronograma de eventos — visible para invitados</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay eventos. Añade la ceremonia, el cóctel, la cena...
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).map(([date, dateEvents]) => (
            <div key={date}>
              <p className="text-sm font-medium text-warm-gray capitalize mb-2">{formatDate(date)}</p>
              <div className="bg-white rounded-xl border divide-y">
                {dateEvents.map((event) => (
                  <div key={event.id} className="p-4 flex items-start gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500 w-24 flex-shrink-0 pt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(event.start_time)}
                      {event.end_time && `–${formatTime(event.end_time)}`}
                    </div>
                    <div className={`w-8 h-8 rounded-lg bg-sage-light/40 flex items-center justify-center flex-shrink-0`}>
                      <EventIcon iconKey={event.icon} className="h-4 w-4 text-sage-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{event.title}</span>
                        {!event.is_public && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Interno
                          </span>
                        )}
                      </div>
                      {event.description && <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>}
                      {event.venues && (
                        <p className="text-xs text-sage-dark mt-1">
                          📍 {event.venues.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditing(event)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ScheduleFormModal
          event={editing}
          venues={venues}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ScheduleFormModal({
  event,
  venues,
  onClose,
}: {
  event: ScheduleEvent | null
  venues: { id: string; name: string }[]
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date || '2027-05-01',
    start_time: event?.start_time?.slice(0, 5) || '',
    end_time: event?.end_time?.slice(0, 5) || '',
    venue_id: event?.venue_id || '',
    icon: event?.icon || 'heart',
    is_public: event?.is_public ?? true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data: ScheduleEventInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      venue_id: form.venue_id || null,
      icon: form.icon,
      is_public: form.is_public,
    }
    try {
      if (event) {
        await updateScheduleEvent(event.id, data)
      } else {
        await createScheduleEvent(data)
      }
      onClose()
    } catch {
      alert('Error al guardar el evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{event ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="P.ej. Ceremonia"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
              <select
                value={form.venue_id}
                onChange={(e) => setForm({ ...form, venue_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sin lugar</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ICONS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Visible por los invitados en su invitación"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Visible para invitados en su invitación
          </label>

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
