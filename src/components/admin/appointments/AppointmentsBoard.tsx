'use client'

import { useMemo, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  MapPin,
  X,
} from 'lucide-react'
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  type AppointmentStatus,
} from '@/features/appointments/actions'
import CalendarMonth from './CalendarMonth'

export interface BoardAppointment {
  id: string
  title: string
  category: string
  vendorId: string | null
  vendorName: string | null
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
  status: AppointmentStatus
  notes: string | null
}

const CATEGORIES = [
  'Prueba vestido/traje',
  'Peluquería/Maquillaje',
  'Cata de menú',
  'Reunión con proveedor',
  'Fotografía/Vídeo',
  'Flores/Decoración',
  'Música',
  'Trámite',
  'Salud',
]

const STATUS_META: Record<AppointmentStatus, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700' },
  confirmada: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700' },
  realizada: { label: 'Realizada', cls: 'bg-gray-100 text-gray-600' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-50 text-red-500' },
}

// Module-scope helpers (react-hooks/purity forbids inline new Date()).
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(iso: string): string {
  return iso.split('-').reverse().join('/')
}

function fmtTime(t: string | null): string {
  return t ? t.slice(0, 5) : ''
}

function timeRange(a: BoardAppointment): string {
  const start = fmtTime(a.startTime)
  const end = fmtTime(a.endTime)
  if (start && end) return `${start}–${end}`
  return start || 'Todo el día'
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function DateBadge({ date }: { date: string }) {
  const [, month, day] = date.split('-')
  return (
    <div className="w-11 flex-shrink-0 text-center rounded-lg border bg-white py-1">
      <p className="text-lg leading-none font-semibold text-gray-900">{day}</p>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{MONTHS_SHORT[parseInt(month, 10) - 1]}</p>
    </div>
  )
}

export default function AppointmentsBoard({
  citas,
  vendors,
}: {
  citas: BoardAppointment[]
  vendors: { id: string; name: string }[]
}) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BoardAppointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<'todos' | AppointmentStatus>('todos')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = todayISO()

  const filtered = statusFilter === 'todos' ? citas : citas.filter((c) => c.status === statusFilter)

  const markedDates = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of filtered) map[c.date] = (map[c.date] || 0) + 1
    return map
  }, [filtered])

  const dayList = selectedDate ? filtered.filter((c) => c.date === selectedDate) : filtered
  const upcoming = dayList.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = dayList.filter((c) => c.date < today).sort((a, b) => b.date.localeCompare(a.date))

  const handleDelete = async (c: BoardAppointment) => {
    if (!confirm(`¿Eliminar la cita "${c.title}" del ${fmtDate(c.date)}?`)) return
    try {
      await deleteAppointment(c.id)
    } catch {
      alert('Error al eliminar la cita')
    }
  }

  const handleStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, status)
    } catch {
      alert('Error al cambiar el estado')
    }
  }

  const renderRow = (c: BoardAppointment) => {
    const meta = STATUS_META[c.status]
    const cancelled = c.status === 'cancelada'
    return (
      <li key={c.id} className={`px-4 py-3 flex items-center gap-3 group ${cancelled ? 'opacity-60' : ''}`}>
        <DateBadge date={c.date} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium text-gray-900 text-sm truncate ${cancelled ? 'line-through' : ''}`}>{c.title}</p>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.cls}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-500">{timeRange(c)}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
            <span>{c.category}</span>
            {c.vendorName && <span>· {c.vendorName}</span>}
            {c.location && (
              <span className="flex items-center gap-0.5 truncate max-w-[220px]">
                <MapPin className="h-3 w-3" /> {c.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <select
            value=""
            onChange={(e) => e.target.value && handleStatus(c.id, e.target.value as AppointmentStatus)}
            title="Cambiar estado"
            className="w-9 h-8 text-xs border rounded-lg text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">⋯</option>
            {(Object.keys(STATUS_META) as AppointmentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
          <button onClick={() => setEditing(c)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(c)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-sage-dark" />
            Citas ({filtered.length})
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todos">Todos los estados</option>
            {(Object.keys(STATUS_META) as AppointmentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Añadir cita
        </button>
      </div>

      {citas.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay citas. Añade pruebas del vestido, catas de menú, visitas a proveedores o cualquier otro compromiso.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          <div className="bg-white rounded-xl border p-4">
            <CalendarMonth
              markedDates={markedDates}
              selectedDate={selectedDate}
              onSelect={(d) => setSelectedDate(d)}
            />
            <p className="text-[11px] text-gray-400 mt-3 text-center">Haz clic en un día para ver sus citas</p>
          </div>

          <div className="space-y-4 min-w-0">
            {selectedDate && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-sage-light/40 text-charcoal text-xs font-medium">
                  {fmtDate(selectedDate)}
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" /> Quitar filtro
                </button>
              </div>
            )}

            <section className="bg-white rounded-xl border overflow-hidden">
              <header className="px-4 py-2.5 border-b bg-gray-50/60">
                <h3 className="text-sm font-semibold text-gray-800">Próximas ({upcoming.length})</h3>
              </header>
              {upcoming.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400">Sin citas próximas.</p>
              ) : (
                <ul className="divide-y">{upcoming.map(renderRow)}</ul>
              )}
            </section>

            {past.length > 0 && (
              <section className="bg-white rounded-xl border overflow-hidden">
                <header className="px-4 py-2.5 border-b bg-gray-50/60">
                  <h3 className="text-sm font-semibold text-gray-400">Pasadas ({past.length})</h3>
                </header>
                <ul className="divide-y opacity-75">{past.map(renderRow)}</ul>
              </section>
            )}
          </div>
        </div>
      )}

      {(creating || editing) && (
        <AppointmentFormModal
          cita={editing}
          vendors={vendors}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// Create/edit modal
// ============================================

function AppointmentFormModal({
  cita,
  vendors,
  onClose,
}: {
  cita: BoardAppointment | null
  vendors: { id: string; name: string }[]
  onClose: () => void
}) {
  const knownCategory = !cita || CATEGORIES.includes(cita.category)
  const [form, setForm] = useState({
    title: cita?.title || '',
    category: cita && !knownCategory ? '' : cita?.category || CATEGORIES[0],
    customCategory: cita && !knownCategory ? cita.category : '',
    vendorId: cita?.vendorId || '',
    date: cita?.date || todayISO(),
    startTime: cita?.startTime ? cita.startTime.slice(0, 5) : '',
    endTime: cita?.endTime ? cita.endTime.slice(0, 5) : '',
    location: cita?.location || '',
    status: (cita?.status || 'pendiente') as AppointmentStatus,
    notes: cita?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data = {
      title: form.title.trim(),
      category: form.customCategory.trim() || form.category,
      vendor_id: form.vendorId || null,
      appointment_date: form.date,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      location: form.location.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }
    try {
      if (cita) {
        await updateAppointment(cita.id, data)
      } else {
        await createAppointment(data)
      }
      onClose()
    } catch {
      alert('Error al guardar la cita')
    } finally {
      setLoading(false)
    }
  }

  const categoryKnown = CATEGORIES.includes(form.category)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{cita ? 'Editar cita' : 'Nueva cita'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input type="text" required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder='P.ej. Segunda prueba del vestido' />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={categoryKnown ? form.category : '__custom__'}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value === '__custom__' ? '' : e.target.value })
                }
                className={inputCls}
              >
                {CATEGORIES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="__custom__">Otro…</option>
              </select>
              {!categoryKnown && (
                <input
                  type="text"
                  required
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  className={`${inputCls} mt-2`}
                  placeholder="Escribe la categoría"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })} className={inputCls}>
                {(Object.keys(STATUS_META) as AppointmentStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (opcional)</label>
            <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className={inputCls}>
              <option value="">— Sin proveedor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder="Opcional · p.ej. Atelier Novias, Madrid" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Qué llevar, dudas, presupuesto…" />
          </div>

          <p className="text-[11px] text-gray-400">
            Recibiréis un email de recordatorio 7 días y 1 día antes de cada cita.
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
