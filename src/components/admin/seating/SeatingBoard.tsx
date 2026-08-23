'use client'

import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Armchair,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  createTable,
  updateTable,
  deleteTable,
  assignGuestToTable,
} from '@/features/seating/actions'

interface BoardGuest {
  id: string
  name: string
  group: string | null
  plusOne: string | null
  confirmed: boolean
}

interface BoardTable {
  id: string
  name: string
  capacity: number
  notes: string | null
  guests: BoardGuest[]
}

interface PoolGuest {
  id: string
  name: string
  group: string | null
  phone: string | null
  plusOne: string | null
}

function seatCount(guests: { plusOne: string | null }[]) {
  return guests.reduce((n, g) => n + 1 + (g.plusOne ? 1 : 0), 0)
}

export default function SeatingBoard({ tables, pool }: { tables: BoardTable[]; pool: PoolGuest[] }) {
  const [editing, setEditing] = useState<BoardTable | null>(null)
  const [creating, setCreating] = useState(false)

  const handleAssign = async (guestId: string, tableId: string) => {
    try {
      await assignGuestToTable(guestId, tableId || null)
    } catch {
      alert('Error al asignar la mesa')
    }
  }

  const handleRemove = async (guestId: string) => {
    try {
      await assignGuestToTable(guestId, null)
    } catch {
      alert('Error al quitar al invitado de la mesa')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta mesa? Sus invitados quedarán sin asignar.')) return
    try {
      await deleteTable(id)
    } catch {
      alert('Error al eliminar la mesa')
    }
  }

  return (
    <div className="space-y-6">
      {/* Unassigned confirmed guests */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-500" />
            Confirmados sin mesa ({pool.length})
          </h2>
          <p className="text-sm text-gray-500">Asigna cada invitado a una mesa</p>
        </div>
        {pool.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Todos los confirmados tienen mesa. ¡Bien organizado!
          </div>
        ) : (
          <div className="divide-y">
            {pool.map((guest) => (
              <div key={guest.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 text-sm">{guest.name}</span>
                  <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                    {guest.group && <span>{guest.group}</span>}
                    {guest.phone && <span>{guest.phone}</span>}
                    {guest.plusOne && <span>+1: {guest.plusOne}</span>}
                  </div>
                </div>
                <select
                  value=""
                  onChange={(e) => handleAssign(guest.id, e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-auto"
                >
                  <option value="" disabled>Asignar a...</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        {tables.length === 0 && pool.length > 0 && (
          <p className="p-3 text-xs text-amber-600 border-t bg-amber-50">
            Primero crea una mesa para poder asignar invitados.
          </p>
        )}
      </div>

      {/* Tables grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-sage-dark" />
          Mesas ({tables.length})
        </h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir mesa
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          Aún no hay mesas. Crea la primera para empezar a organizar el banquete.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => {
            const occupied = seatCount(table.guests)
            const pct = table.capacity > 0 ? Math.min(100, Math.round((occupied / table.capacity) * 100)) : 100
            const over = occupied > table.capacity
            return (
              <div key={table.id} className="bg-white rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{table.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Armchair className="h-3.5 w-3.5" />
                      {occupied} / {table.capacity} plazas
                      {over && <span className="text-red-600 font-medium">· ¡Excedido!</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(table)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(table.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {table.guests.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Mesa vacía</p>
                ) : (
                  <ul className="space-y-2">
                    {table.guests.map((g) => (
                      <li key={g.id} className="flex items-start justify-between gap-2 group">
                        <div className="min-w-0">
                          <span className="text-sm text-gray-900">{g.name}</span>
                          {!g.confirmed && (
                            <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 align-middle">
                              Sin confirmar
                            </span>
                          )}
                          <div className="text-xs text-gray-400">
                            {g.group && <span>{g.group}</span>}
                            {g.plusOne && <span className={g.group ? ' · ' : ''}>+1: {g.plusOne}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(g.id)}
                          title="Quitar de la mesa"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 text-sm leading-none p-1"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {pool.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => e.target.value && handleAssign(e.target.value, table.id)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">+ Añadir invitado a esta mesa…</option>
                    {pool.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      )}

      {(creating || editing) && (
        <TableFormModal
          table={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function TableFormModal({ table, onClose }: { table: BoardTable | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: table?.name || '',
    capacity: table?.capacity.toString() || '8',
    notes: table?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data = {
      name: form.name.trim(),
      capacity: Math.max(1, parseInt(form.capacity, 10) || 8),
      notes: form.notes.trim() || null,
    }
    try {
      if (table) {
        await updateTable(table.id, data)
      } else {
        await createTable(data)
      }
      onClose()
    } catch {
      alert('Error al guardar la mesa (¿ya existe una mesa con ese nombre?)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{table ? 'Editar mesa' : 'Nueva mesa'}</h2>
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
              placeholder='P.ej. Mesa 1, Novios, Familia…'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aforo</label>
            <input
              type="number"
              min="1"
              required
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="P.ej. cerca de los novios, silla especial…"
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
